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
      (masksChanged.length / 1000.0)
      * 100
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

  const rewriter = new HTMLRewriter()

  const matches = {}
  const selectors = selector.split(',').map(s => s.trim())

  try {
    selectors.forEach((selector) => {
      matches[selector] = []

      let nextText = ''

      rewriter.on(selector, {
        element(element) {
          matches[selector].push(true)
          nextText = ''
        },

        text(text) {
          nextText += text.text

          if (text.lastInTextNode) {
            if (spaced) nextText += ' '
            matches[selector].push(nextText)
            nextText = ''
          }
        }
      })
    })

  } catch (error) {
    return generateJSONResponse({
      error: `The selector \`${ selector }\` is invalid or another HTML parsing error occured`
    }, pretty)
  }

  const transformed = rewriter.transform(response)

  await transformed.text()

  selectors.forEach((selector) => {
    const nodeCompleteTexts = []

    let nextText = ''

    matches[selector].forEach(text => {
      if (text === true) {
        if (nextText.trim() !== '') {
          nodeCompleteTexts.push(cleanText(nextText))
          nextText = ''
        }
      } else {
        nextText += text
      }
    })

    const lastText = cleanText(nextText)
    if (lastText !== '') nodeCompleteTexts.push(lastText)
    matches[selector] = nodeCompleteTexts
  })

  return generateJSONResponse(
    processJSONResponseToShields({
      result: selectors.length === 1 ? matches[selectors[0]] : matches
    }), pretty)
}
