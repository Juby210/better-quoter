const { Plugin } = require('powercord/entities')
const { findInReactTree, getReactInstance } = require('powercord/util')
const { getModule, getModuleByDisplayName, messages, FluxDispatcher, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')

const QuoteBtn = require('./components/QuoteBtn')
const QuoteContainer = require('./components/QuoteContainer')
const Settings = require('./components/Settings')
const vars = require('./variables')
let quotedUsers = []

// Below Copied from ZLibrary
const getProp = (e, t) => t.split('.').reduce((e, p) => e && e[p], e)

const { channelTextArea } = getModule(['channelTextArea', 'chat'], false) || {}
const { getGuild } = getModule(['getGuild'], false) || {}
const { getMessage } = getModule(['getMessages'], false) || {}

module.exports = class BetterQuoter extends Plugin {
    injections = ['betterquoter-textarea', 'betterquoter-textarea-submit', 'betterquoter-send', 'betterquoter-upload', 'betterquoter-reply', 'betterquoter-message']

    async startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: 'BetterQuoter',
            render: props => React.createElement(Settings, {
                createQuotes: (...args) => this.createQuotes(...args),
                repatch: () => this.patch(true),
                ...props
            })
        })
        this.loadStylesheet('style.css')

        FluxDispatcher.subscribe('BETTER_QUOTER_UPDATE2', this.subscribe = data => {
            this.forceTextAreaUpdate(data.quotedUsers)
            quotedUsers = data.quotedUsers

            this.forceMessagesUpdate()
        })

        const Message = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM)
        const ChannelMessage = await getModule(m => m.type && m.type.displayName == 'ChannelMessage')
        const MiniPopover = await getModule(m => m.default && m.default.displayName == 'MiniPopover')
        if (MiniPopover) {
            inject('betterquoter-toolbar', MiniPopover, 'default', ([{ children }], ret) => {
                if (!children || !Array.isArray(children) || children.slice(-1).length === 0) return ret
                const { props: { message, channel } } = children.slice(-1)[0] || { props: {} }
                if (!message || !channel) return ret
                children.unshift(
                    React.createElement(QuoteBtn, {
                        Button: MiniPopover.Button,
                        onClick: () => {
                            let content = message.content
                            if (this.settings.get('quoteOnlySelected')) {
                                const selection = this.getSelection()
                                if (selection && content.includes(selection.substr(4, selection.length - 8))) content = selection
                            }

                            const msg = content !== message.content ? new Message({ ...message, content }) : message
                            if (this.settings.get('classicMode')) return this.insertText(this.createQuote(msg, channel))
                            this.updateQuotes([ ...quotedUsers, React.createElement(ChannelMessage, { message: msg, channel }) ])
                        }
                    })
                )
                const buttons = children[children.length - 1]
                if (buttons && buttons.props) buttons.props.canQuote = false
                return ret
            })
            MiniPopover.default.displayName = 'MiniPopover'
        }

        this.patch()
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID);
        [ 'betterquoter-toolbar', ...this.injections ].forEach(i => uninject(i))
        if (this.subscribe) FluxDispatcher.unsubscribe('BETTER_QUOTER_UPDATE2', this.subscribe)
        document.querySelectorAll('.betterQuoterBtn').forEach(e => e.style.display = 'none')
        this.forceTextAreaUpdate([])
    }

    async patch(repatch) {
        if (repatch) this.injections.forEach(i => uninject(i))
        if (this.settings.get('classicMode')) return
        const classes = {
            ...await getModule(['hasReply', 'webkit']),
            ...await getModule(['message', 'replying'])
        }
        const ChannelTextAreaContainer = await getModule(m => m?.type?.render?.displayName === 'ChannelTextAreaContainer')
        inject('betterquoter-textarea', ChannelTextAreaContainer.type, 'render', (_, res) => {
            const child = res?.props?.children
            if (!child) return res
            const children = (Array.isArray(child) ? child[0] : child)?.props?.children
            if (!children) return res
            children.unshift(React.createElement(QuoteContainer, {
                createQuotes: this.createQuotes.bind(this),
                settings: { get: this.settings.get.bind(this), set: this.settings.set.bind(this) }
            }))
            if (quotedUsers.length) {
                const textArea = findInReactTree(children, e => e?.onScroll)
                if (textArea && textArea.className.indexOf('hasReply') === -1) textArea.className += ' ' + classes.hasReply
            }
            return res
        })
        ChannelTextAreaContainer.type.render.displayName = 'ChannelTextAreaContainer'
        const { serialize } = await getModule(['serialize', 'serializeSelection']), _this = this
        const SlateChannelTextArea = await getModuleByDisplayName('SlateChannelTextArea')
        inject('betterquoter-textarea-submit', SlateChannelTextArea.prototype, 'handleTabOrEnterDown', function (_, submit) {
            if (submit && quotedUsers.length && !this.props.textAreaPaddingClassName.includes('WithoutAttachmentButton')) {
                const serialized = serialize(this.props.value.document, 'raw')
                if (!serialized.trim()) {
                    const content = _this.insertQuotes(serialized)
                    if (content) this.props.onSubmit(content)
                }
            }
            return submit
        })
        inject('betterquoter-send', messages, 'sendMessage', args => {
            if (quotedUsers.length && args.length >= 2) {
                const content = this.insertQuotes(args[1].content)
                if (!content) return false
                args[1].content = content
            }
            return args
        }, true)
        const uploadModule = await getModule(['cancel', 'upload'])
        inject('betterquoter-upload', uploadModule, 'upload', args => {
            if (quotedUsers.length && args.length >= 3) {
                const content = this.insertQuotes(args[2].content)
                if (content) args[2].content = content
            }
            return args
        }, true)

        const ChannelReply = await getModule(m => m?.default?.displayName === 'ChannelReply')
        inject('betterquoter-reply', ChannelReply, 'default', (_, res) => {
            if (quotedUsers.length && res?.props) res.props.style = { 'border-top-left-radius': 0, 'border-top-right-radius': 0 }
            return res
        })
        ChannelReply.default.displayName = 'ChannelReply'

        const Message = await getModule(m => m.type && (m.__powercordOriginal_type || m.type).toString().indexOf('useContextMenuMessage') !== -1)
        inject('betterquoter-message', Message, 'type', (args, res) => {
            const message = findInReactTree(res, e => e.className)
            if (!message || !quotedUsers.length) return res
            if (quotedUsers.find(m => m.props.message.id === args[0].message.id) && message.className.indexOf('replying') === -1) {
                message.className += ' ' + classes.replying
            }

            return res
        })
        Message.type.toString = () => Message.__powercordOriginal_type.toString()
    }

    forceTextAreaUpdate(newQuotes) {
        if (!quotedUsers.length && newQuotes.length || quotedUsers.length && !newQuotes.length) {
            const textArea = document.querySelector(`.${channelTextArea}`)
            if (textArea) getReactInstance(textArea).memoizedProps.onMouseDown() // hacky force update
        }
    }
    forceMessagesUpdate() {
        document.querySelectorAll('[id^="chat-messages-"]').forEach(e => getReactInstance(e).memoizedProps?.children?.props?.onMouseMove?.())
    }
    updateQuotes(newQuotes) {
        this.forceTextAreaUpdate(newQuotes)
        quotedUsers = newQuotes
        FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE', quotedUsers })
    }
    get quoted() {
        return quotedUsers
    }
    insertQuotes(content) {
        const quotes = this.createQuotes(quotedUsers)
        const ret = this.settings.get('afterQuote', true) ? quotes + content : content + quotes
        if (ret.length > 2000) {
            const r = Math.random()
            powercord.api.notices.sendToast(`quoterError-${r}`, { content: `Your quote is too long. Your'e ${ret.length - 2000} chars over the limit.`, timeout: 4000 })
            setTimeout(() => powercord.api.notices.closeToast(`quoterError-${r}`), 4050) // just to make sure
            return false
        }
        this.updateQuotes([])
        this.forceMessagesUpdate()
        return ret
    }
    createQuotes(quotes = []) {
        let text = ''
        for (const m of quotes) {
            if (text && !text.endsWith('\n')) text += '\n' 
            if (m.props.isGroupStart || m.props.isGroupStart === undefined) text += this.createQuote(m.props.message, m.props.channel)
            else text += this.createQuote(m.props.message, m.props.channel, 'stackedFormat', '%quote%')
        }
        return text
    }

    createQuote(message, channel, setting = 'text', d = '> `%name% - %time%` in <#%channelid%>\n%quote%\n%files%') {
        const guild = channel.guild_id && getGuild(channel.guild_id)
        const replaceMentions = this.settings.get('replaceMentions', 0)
        let { content } = message

        if (replaceMentions) {
            const { getUser } = getModule(['getUser', 'getCurrentUser'], false)
            content = content.replace(/<@[!&]{0,1}([0-9]{10,})>/g, (string, match) => {
                const user = getUser(match)
                if (user) return this.formatMention(user)
                const role = guild && guild.roles && guild.roles[match]
                if (role) return this.formatMention(role, true)
                return string
            })
        }

        let text = this.settings.get(setting, d)
        vars.forEach(r => {
            const prop = getProp({ message, channel, content, guild }, r.prop)
            text = text.replace(new RegExp(`%${r.selector}%`, 'gi'), r.fn ? r.fn(prop, channel, message, { getMessage }) : prop)
        })

        const shouldBreak = this.settings.get('breakLine', true) ?
            this.settings.get('afterQuote', true) ? !text.endsWith('\n') : !text.startsWith('\n') : false
        return shouldBreak ? this.settings.get('afterQuote', true) ? text + '\n' : '\n' + text : text
    }
    formatMention(target, role) {
        const format = this.settings.get('replaceMentions', 0)
        if (format == 1) {
            if (role) return `\`@${target.name}\``
            if (this.settings.get('showFullTagInMentions', true)) return `\`@${target.tag}\``
            return `\`@${target.username}\``
        }
        if (role) return `\`@\`${target.name}`
        if (this.settings.get('showFullTagInMentions', true)) return `\`@\`${target.tag}`
        return `\`@\`${target.username}`
    }
    async insertText(content) {
        const { ComponentDispatch } = await getModule(['ComponentDispatch'])
        ComponentDispatch.dispatchToLastSubscribed('INSERT_TEXT', { content })
    }

    // send help.
    getSelection() {
        const sel = getSelection()
        return sel.rangeCount > 0 ? this.parseNodes(sel.getRangeAt(0).cloneContents().childNodes).trim() : ''
    }
    parseNodes(nodes) {
        return Array.from(nodes).map(this.parseNode.bind(this)).join('')
    }
    parseNode(n) {
        let c = n.textContent
        if (!c) return c
        if (n.childNodes && n.childNodes.length > 0) c = this.parseNodes(n.childNodes)

        switch (n.tagName) {
            case 'BLOCKQUOTE':
                const parsed = c.replace('\n', '\n> ')
                const ret = `> ${parsed}${parsed.endsWith('\n') ? '' : '\n'}`
                return ret.endsWith('> \n') ? ret.substr(0, ret.length - 3) : ret
            case 'STRONG':
                return `**${c}**`
            case 'EM':
                return `*${c}*`
            case 'S':
                return `~~${c}~~`
            case 'CODE':
                return `\`${c}\``
            case 'SPAN':
                if (n.className && n.className.indexOf('latin') === 0) return '' // timestamp
        }
        return c
    }
}
