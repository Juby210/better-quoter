const { Plugin } = require("powercord/entities")
const { getModule, getModuleByDisplayName, messages, React } = require("powercord/webpack")
const { inject, uninject } = require("powercord/injector")

const QuoteContainer = require("./components/QuoteContainer")
const Settings = require("./components/Settings")
const replacers = require("./replacers.json")
let quotedUsers = []

const dispatcher = getModule(['dispatch'], false)

// Below Copied from ZLibrary
const getProp = (e, t) => t.split(".").reduce((e, p) => e && e[p], e)

module.exports = class BetterQuoter extends Plugin {
    async startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: "BetterQuoter",
            render: props => React.createElement(Settings, {
                createQuotes: (...args) => this.createQuotes(...args),
                repatch: () => this.patch(true),
                ...props
            })
        })
        this.loadStylesheet("style.css")

        dispatcher.subscribe("BETTER_QUOTER_UPDATE2", this.subscribe = data => quotedUsers = data.quotedUsers)

        const ChannelMessage = await getModule(m => m.type && m.type.displayName == "ChannelMessage")
        const MiniPopover = await getModule(m => m.default && m.default.displayName == "MiniPopover")
        if (MiniPopover) {
            const QuoteBtn = require("./components/QuoteBtn")(MiniPopover)
            inject("betterquoter-toolbar", MiniPopover, "default", ([{ children }], ret) => {
                if (!children || !Array.isArray(children) || children.slice(-1).length == 0) return ret
                const { message, channel } = children.slice(-1)[0].props
                children.unshift(
                    React.createElement(QuoteBtn, {
                        onClick: () => {
                            if (this.settings.get("classicMode")) return this.insertText(this.createQuote(message, channel))
                            quotedUsers.push(React.createElement(ChannelMessage, { message, channel }))
                            dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE", quotedUsers })
                        }
                    })
                )
                return ret
            })
            MiniPopover.default.displayName = "MiniPopover"
        }

        inject("betterquoter-quote", await getModule(["createQuotedText"]), "createQuotedText", ([ message, channel ]) => {
            if (this.settings.get("classicMode") || !this.settings.get("useQuoteContainerForAllQuotes", true)) return this.createQuote(message, channel)
            quotedUsers.push(React.createElement(ChannelMessage, { message, channel }))
            dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE", quotedUsers })
            return ""
        })

        this.patch()
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID);
        ["betterquoter-toolbar", "betterquoter-quote", "betterquoter-textarea", "betterquoter-textarea-submit", "betterquoter-send"].forEach(i => uninject(i))
        if (this.subscribe) dispatcher.unsubscribe("BETTER_QUOTER_UPDATE2", this.subscribe)
    }

    async patch(repatch) {
        if (repatch) ["betterquoter-textarea", "betterquoter-textarea-submit", "betterquoter-send"].forEach(i => uninject(i))
        if (this.settings.get("classicMode")) return
        const ChannelTextAreaGuard = await getModuleByDisplayName("ChannelTextAreaGuard")
        inject("betterquoter-textarea", ChannelTextAreaGuard.prototype, "render", (_, res) => {
            const old = res.props.children
            if (typeof old == "function") res.props.children = e => [ React.createElement(QuoteContainer), old(e) ]
            else res.props.children = React.createElement(React.Fragment, null, React.createElement(QuoteContainer), old)
            return res
        })
        const { serialize } = await getModule(["serialize", "serializeSelection"]), _this = this
        const SlateChannelTextArea = await getModuleByDisplayName("SlateChannelTextArea")
        inject("betterquoter-textarea-submit", SlateChannelTextArea.prototype, "handleTabOrEnterDown", function (_, submit) {
            if (submit && quotedUsers.length) {
                const serialized = serialize(this.props.value.document, "raw")
                if (!serialized.trim()) {
                    const content = _this.insertQuotes(serialized)
                    if (content) this.props.onSubmit(content)
                }
            }
            return submit
        })
        inject("betterquoter-send", messages, "sendMessage", args => {
            if (quotedUsers.length) {
                const content = this.insertQuotes(args[1].content)
                if (!content) return false
                args[1].content = content
            }
            return args
        }, true)
    }

    get quoted() {
        return quotedUsers
    }
    insertQuotes(content) {
        const quotes = this.createQuotes(quotedUsers)
        const ret = quotes + content
        if (ret.length > 2000) {
            const r = Math.random()
            powercord.api.notices.sendToast(`quoterError-${r}`, { content: `Your quote is too long. Your'e ${ret.length - 2000} chars over the limit.`, timeout: 4000 })
            setTimeout(() => powercord.api.notices.closeToast(`quoterError-${r}`), 4050) // just to make sure
            return false
        }
        quotedUsers = []
        dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE", quotedUsers })
        return ret
    }
    createQuotes(quotes = []) {
        let text = ""
        for (const m of quotes) {
            if (m.props.isGroupStart || m.props.isGroupStart === undefined) text += this.createQuote(m.props.message, m.props.channel)
            else text += this.createQuote(m.props.message, m.props.channel, "stackedFormat", "%quote%")
        }
        return text
    }

    createQuote(message, channel, setting = "text", d = "> `%name% - %time%` in <#%channelid%>\n%quote%\n%files%") {
        const { getGuild } = getModule(["getGuild"], false)
        const guild = channel.guild_id && getGuild(channel.guild_id)
        const replaceMentions = this.settings.get("replaceMentions", 0)
        let { content } = message
        if (replaceMentions) {
            const { getUser } = getModule(["getUser", "getCurrentUser"], false)
            content = content.replace(/<@[!&]{0,1}([0-9]{10,})>/g, (string, match) => {
                const user = getUser(match)
                if (user) return this.formatMention(user)
                const role = guild && guild.roles && guild.roles[match]
                if (role) return this.formatMention(role, true)
                return string
            })
        }
        let text = this.settings.get(setting, d)
        replacers.forEach(r => {
            const prop = getProp({ message, channel, content, guild }, r.prop)
            text = text.replace(new RegExp(`%${r.selector}%`, "g"), r.eval ? eval(r.eval) : prop)
        })
        return text.endsWith("\n") ? text : text + "\n"
    }
    formatMention(target, role) {
        const format = this.settings.get("replaceMentions", 0)
        if (format == 1) {
            if (role) return `\`@${target.name}\``
            if (this.settings.get("showFullTagInMentions", true)) return `\`@${target.tag}\``
            return `\`@${target.username}\``
        }
        if (role) return `\`@\`${target.name}`
        if (this.settings.get("showFullTagInMentions", true)) return `\`@\`${target.tag}`
        return `\`@\`${target.username}`
    }
    async insertText(content) {
        const { ComponentDispatch } = await getModule(["ComponentDispatch"])
        ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", { content })
    }
}
