// Mirror from GitHub Actions generated JSON
const githubPagesBadgeJsonUrl = "https://nelsonjchen.github.io/comma-pencil-completion-badge/badge.json"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(
    githubPagesBadgeJsonUrl
  )
  return response
}
