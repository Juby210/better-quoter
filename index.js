const { 
    entities: { 
        Plugin 
    }, 
    injector: { 
        inject, 
        uninject 
    }, webpack: { 
        getModule, 
        React 
    } 
} = require("powercord")
const Toolbar = getModule(m=>m.default && m.default.displayName === "MiniPopover", false);
const insertText = e => getModule(['ComponentDispatch'], false).ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {content: e})
const QuoteBtn = require("./QuoteBtn.jsx")(Toolbar)
module.exports = class BetterQuoter extends Plugin {
    startPlugin() {
        this.loadStylesheet('style.css');
        powercord.api.settings.registerSettings('betterquoter', {
            category: this.entityID,
            label: 'BetterQuoter',
            render: require("./SettingsPanel.jsx")
        });
        if(Toolbar) inject("betterquoter1", Toolbar, "default", ([{children}], ret) => {
            if(!children || !Array.isArray(children) || children.slice(-1).length == 0) return ret;
            const { message, channel } = children.slice(-1)[0].props;
            children.unshift(
                React.createElement(QuoteBtn, {
                    onClick: () => insertText(this.parseMessage(message, channel)),
                })
            )
            return ret;
        })
        Toolbar.default.displayName = "MiniPopover"
        inject("betterquoter2", getModule(["createQuotedText"], false), "createQuotedText", ([message, channel]) => {
            return this.parseMessage(message, channel)
        })
    }
    parseMessage(message, channel) {
        return this.settings.get('text', `> \`%name% - %time% in\` <#%channelId%>\n\`\`\`fix\n%msg%\n%files%\n\`\`\``)
            .replace(/%msg%/g, message.content)
            .replace(/%name%/gi, message.author.username)
            .replace(/%time%/gi, new Date(message.timestamp).toLocaleString())
            .replace(/%channelid%/gi, channel.id)
            .replace(/%channel%/gi, channel.name)
            .replace(/%files%/gi, message.attachments.map(e=>`[${e.filename}]`).join(" "))
    }
    pluginWillUnload() {
        powercord.api.settings.unregisterSettings('betterquoter');
        uninject("betterquoter1");
        uninject("betterquoter2")
    }
}