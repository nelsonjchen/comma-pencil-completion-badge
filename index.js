// Most code if not all ripped from https://github.com/adamschwartz/web.scraper.workers.dev/blob/995e0fd351bf349955724d403658be9a40c0bf18/index.js#L70-L128

const githubUrl = "https://github.com/commaai/comma10k/compare/9b327ccde35edf7d9bd51af247e3d785a87f759e...commaai:master?expand=1"
const selector = ".file-info > a"
const pretty = true
const spaced = false

const contentTypes = {
  html: 'text/html;charset=UTF-8',
  json: 'application/json;charset=UTF-8'
}

const cleanText = s => s.trim().replace(/\s\s+/g, ' ')

const formatJSON = (obj, pretty) => JSON.stringify(obj, null, pretty ? 2 : 0)

const generateJSONResponse = (obj, pretty) => {
  return new Response(formatJSON(obj, pretty), {
    headers: {
      'content-type': contentTypes.json,
      'Access-Control-Allow-Origin': '*'
    }
  })
}

const processJSONResponseToShields = (obj) => {
  const masksChanged = obj.result.filter((name) => name.startsWith('masks/'))
  const percentage =
    (
      (masksChanged.length / 1000.0) *
      100
    ).toFixed(2) + "%"

  return {
    schemaVersion: 1,
    label: "compleition",
    message: percentage,
    color: 'green',
    changed: masksChanged
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})


async function handleRequest(request) {
  const response = await fetch(githubUrl)

  const server = response.headers.get('server')

  const isThisWorkerErrorNotErrorWithinScrapedSite = (
    [530, 503, 502, 403, 400].includes(response.status) &&
    (server === 'cloudflare' || !server /* Workers preview editor */ )
  )

  if (isThisWorkerErrorNotErrorWithinScrapedSite) {
    return generateJSONResponse({
      error: `Status ${ response.status } requesting ${ url }`
    }, pretty)
  }

  // Grab number of files changed and commit IDs

  const rewriter = new HTMLRewriter()


  let changeCount = 0
  let diffUrl = ''

  const changeCountSelector = 'a[href="#files_bucket"] > .Counter'
  const diffUrlSelector = 'include-fragment[src^="/commaai/comma10k/diffs"]'

  let texts = []
  try {

    rewriter.on(changeCountSelector, {
      text(text) {
        if (text.text.length > 0) {
          changeCount = parseInt(text.text)
        }
      }
    })

    rewriter.on(diffUrlSelector, {
      element(element) {
        diffUrl = element.getAttribute('src').replace(/&amp;/g, '&');
      }
    })

  } catch (error) {
    return generateJSONResponse({
      error: `The page selector \`${ selector }\` is invalid or another HTML parsing error occured. ${error}`
    }, pretty)
  }


  const transformed = rewriter.transform(response)

  await transformed.text()

  // Generate diffURLs to hit
  let diffUrls = []
  let diffUrlsPageCount = Math.floor(changeCount / 300)
  for (let step = 0; step <= diffUrlsPageCount; step++) {
    diffUrls.push(
      diffUrl.replace('start_entry=300', `start_entry=${step * 300}`)
    )
  }

  let diffFileNames = (await Promise.all(
    diffUrls.map(async (diffUrl) => {
      let diffResponse = await fetch(`https://github.com${diffUrl}`)
      const rewriter = new HTMLRewriter()
      let filenames = []
      rewriter.on('.file-info > a', {
        text(text) {
          if (text.text.startsWith('masks/')) {
            filenames.push(text.text)
          }
        }
      })
      const transformed = rewriter.transform(diffResponse)

      await transformed.text()

      return filenames
    })
  )).flat(1)

  const percentageFloat = (diffFileNames.length / 1000.0) * 100

  let color = 'red'
  if (percentageFloat > 90.0) {
    color = 'green'
  } else if (percentageFloat > 80.0) {
    color = 'yellow'
  } else if (percentageFloat > 70.0) {
    color = 'orange'
  }

  const percentage =
    percentageFloat.toFixed(2) + "%"

  if (request.url.endsWith('/badge.json')) {
    return generateJSONResponse({
      schemaVersion: 1,
      label: "Count and Percentage of Images Labeled",
      message: `${diffFileNames.length}, ${percentage}`,
      color,
    }, pretty)
  }

  return generateJSONResponse({
    count: changeCount,
    texts,
    diffUrl,
    diffUrls,
    diffFileNames,
    schemaVersion: 1,
    label: "Count and Percentage of Images Labeled",
    message: `${diffFileNames.length}, ${percentage}`,
    color,
  }, pretty)


}
