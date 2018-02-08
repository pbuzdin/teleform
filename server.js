const superagent = require('superagent')
const prettyaml = require('prettyaml')

const app = require('express')()
app.use(require('body-parser').urlencoded({extended: false}))
app.use(require('body-parser').json())

superagent.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {url: 'https://teleform.glitch.me/tg/webhook'})
  .then(r => console.log(r.text))
  .catch(e => console.log(e.response.text))

app.post('/tg/webhook', (r, w) => {
  w.status(200).end()
  
  let message = r.body.message
  console.log(message)

  if (message.text === '/start') {
    superagent.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: message.chat.id,
      text: `
Hello, ${message.from.first_name}! You are now able to receive submissions on this chat.

To start, just create a form on your site with the \`action=\` attribute set to \`https://teleform.glitch.me/c/${message.chat.id}\` and submit it.

Or, if you know \`curl\`, you can do a quick test with \`\`\`
curl -X POST https://teleform.glitch.me/c/${message.chat.id} -H 'Content-Type: application/json' -d '{"hello": "world!"}'\`\`\`
      `,
      parse_mode: 'Markdown'
    })
      .then(res => console.log(res.text))
      .catch(e => console.log(e.response.text))
  }
})

app.post('/c/:chat', (r, w) => {
  console.log('got submission', JSON.stringify(r.body))

  superagent.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    chat_id: r.params.chat,
    text: `
Someone has submitted your form, here's what they say:

\`\`\`
${prettyaml.stringify(r.body)}
\`\`\`
    `,
    parse_mode: 'Markdown'
  })
    .then(res => console.log(res.text) || w.send({ok: true}))
    .catch(e => {
      console.log(e.response.text)
      w.status(400).send({ok: false, error: e.response.text})
    })
})

console.log('listening')
app.listen(process.env.PORT)
