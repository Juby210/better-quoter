module.exports = [
    {
        selector: "msg",
        prop: "content",
        desc: "Used to get the content from the message."
    },
    {
        selector: "quote",
        prop: "content",
        desc: "Used to get the content from the message, but already quoted in markdown.",
        fn: prop => prop != "" ? "> " + prop.replace(/\n/g, "\n> ") : ""
    },
    {
        selector: "id",
        prop: "message.id",
        desc: "Used to get the id from message."
    },
    {
        selector: "authorid",
        prop: "message.author.id",
        desc: "Used to get the id of message author."
    },
    {
        selector: "name",
        prop: "message.author.username",
        desc: "Used to get the name from the author."
    },
    {
        selector: "nick",
        prop: "message.nick",
        desc: "Used to get the nick or username from the author.",
        fn: (prop, _, message) => prop || message.author.username
    },
    {
        selector: "time",
        prop: "message.timestamp",
        desc: "Used to get the timestamp from the message.",
        fn: prop => prop.toDate().toLocaleString()
    },
    {
        selector: "channelid",
        prop: "channel.id",
        desc: "Used to get the id from channel where the message was send."
    },
    {
        selector: "channel",
        prop: "channel.name",
        desc: "Used to get the name from channel where the message was send.",
        fn: (prop, channel) => prop != "" ? prop : channel.rawRecipients.length > 1 ? channel.rawRecipients.map(r => r.username).join(", ") : "DM"
    },
    {
        selector: "server",
        prop: "guild.name",
        desc: "Used to get the name from guild where message was send.",
        fn: prop => prop ? prop : "DMs"
    },
    {
        selector: "serverid",
        prop: "guild.id",
        desc: "Used to get the id from guild where message was send.",
        fn: prop => prop ? prop : "@me"
    },
    {
        selector: "url",
        prop: "guild.id",
        desc: "Used to get the message url.",
        fn: (prop, channel, message) => `https://discord.com/channels/${prop ? prop : "@me"}/${channel.id}/${message.id}`
    },
    {
        selector: "files",
        prop: "message.attachments",
        desc: "Used to get all the attachments send in the message. Replaced with: [filename.txt]",
        fn: prop => prop.map(e => `[${e.filename}]`).join(" ")
    },
    {
        selector: "replycontent",
        prop: "message.messageReference",
        desc: "Used to quote reply content",
        fn: getReplyContent
    },
    {
        selector: "quotereplycontent",
        prop: "message.messageReference",
        desc: 'Used to quote reply content with "> " prefix',
        fn: (...args) => getReplyContent(...args) ? '> ' + getReplyContent(...args) : ''
    }
]

function getReplyContent(prop, c, m, { getMessage }) {
    const msg = prop && getMessage(prop.channel_id, prop.message_id)
    if (!msg) return ''
    return msg.content.substr(0, 60).replace('\n', ' ') + '\n'
}
