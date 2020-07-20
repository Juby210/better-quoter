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
        let text = this.settings.get('text', `> \`%name% - %time% in\` <#%channelId%>\n\`\`\`fix\n%msg%\n%files%\n\`\`\``)
        replacers.forEach(r => {
            const prop = getProp({ message, channel }, r.prop)
            text = text.replace(new RegExp(`%${r.selector}%`, 'g'), r.eval ? eval(r.eval) : prop)
        })
        return text
    }

    async insertText(content) {
        const { ComponentDispatch } = await getModule(["ComponentDispatch"])
        ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", { content })
    }
}
