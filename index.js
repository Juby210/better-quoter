const { Plugin } = require("powercord/entities")
const { getModule, React } = require("powercord/webpack")
const { inject, uninject } = require("powercord/injector")

const Settings = require("./components/Settings")
const replacers = require("./replacers.json")

// Below Copied from ZLibrary
const getProp = (e, t) => t.split(".").reduce((e, p) => e && e[p], e)

module.exports = class BetterQuoter extends Plugin {
    async startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: "BetterQuoter",
            render: Settings
        })

        const Toolbar = await getModule(m => m.default && m.default.displayName === "MiniPopover")
        if (Toolbar) {
            const QuoteBtn = require("./components/QuoteBtn")(Toolbar)
            inject("betterquoter1", Toolbar, "default", ([{ children }], ret) => {
                if (!children || !Array.isArray(children) || children.slice(-1).length == 0) return ret
                const { message, channel } = children.slice(-1)[0].props
                children.unshift(
                    React.createElement(QuoteBtn, {
                        onClick: () => this.insertText(this.parseMessage(message, channel)),
                    })
                )
                return ret
            })
            Toolbar.default.displayName = "MiniPopover"
        }

        inject("betterquoter2", getModule(["createQuotedText"], false), "createQuotedText", args => this.parseMessage(...args))
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID)
        uninject("betterquoter1")
        uninject("betterquoter2")
    }

    parseMessage(message, channel) {
        const replaceMentions = this.settings.get("replaceMentions", 0)
        let { content } = message
        if (replaceMentions) {
            const { getUser } = getModule(["getUser", "getCurrentUser"], false)
            const { getGuild } = getModule(["getGuild"], false)
            const guild = channel.guild_id && getGuild(channel.guild_id)
            content = content.replace(/<@[!&]{0,1}([0-9]{10,})>/g, (string, match) => {
                const user = getUser(match)
                if (user) return this.formatMention(user)
                const role = guild && guild.roles && guild.roles[match]
                if (role) return this.formatMention(role, true)
                return string
            })
        }
        let text = this.settings.get("text", "> `%name% - %time%` in <#%channelid%>\n%quote%\n%files%")
        replacers.forEach(r => {
            const prop = getProp({ message, channel, content }, r.prop)
            text = text.replace(new RegExp(`%${r.selector}%`, "g"), r.eval ? eval(r.eval) : prop)
        })
        return text
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
