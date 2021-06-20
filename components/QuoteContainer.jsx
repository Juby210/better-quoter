const { getModule, FluxDispatcher, React } = require('powercord/webpack')
const { Divider, Tooltip, Icon } = require('powercord/components')

let quotedUsers = [], preview

const classes = {
    ...getModule(['actions', 'container'], false),
    ...getModule(['colorHeaderSecondary'], false),
    ...getModule(['auto', 'scrollerBase'], false),
    ...getModule(['size14'], false),
    ...getModule(['markup'], false)
}
const parser = getModule(['parse', 'parseTopic'], false)

module.exports = class QuoteContainer extends React.Component {
    constructor(props) {
        super(props)

        if (!quotedUsers.length && props.settings.get('rememberPreview')) preview = props.settings.get('preview')
        FluxDispatcher.subscribe('BETTER_QUOTER_UPDATE', this.subscribe = data => {
            quotedUsers = data.quotedUsers
            this.forceUpdate()
        })
    }

    componentWillUnmount() {
        if (this.subscribe) FluxDispatcher.unsubscribe('BETTER_QUOTER_UPDATE', this.subscribe)
    }

    renderHeader(authors) {
        return <div className={`${classes.container} ${classes.replyBar} quoteHeader`}>
            <div className={`${classes.colorHeaderSecondary} ${classes.size14} ${classes.text}`}>
                Quoting {authors.reduce((items, item, index, _this) => {
                    const ret = <span class={classes.name} style={{ color: item.color ?? void 0 }}>{item.name}</span>
                    if (_this.length === 1) return items.concat(ret)
                    if (index === _this.length - 1) items.push(' and ')
                    return items.concat(ret, index === _this.length - 1 || index === _this.length - 2 ? null : ', ').filter(e => e)
                }, [])}
            </div>
            <div className={classes.actions}>
                <div onClick={() => {
                    preview = !preview
                    if (this.props.settings.get('rememberPreview')) this.props.settings.set('preview', preview)
                    this.forceUpdate()
                }}>
                    <Tooltip text={preview ? 'Disable preview' : 'Preview'} className={`${classes.closeButton}${preview ? ' quotePreviewActive' : ''}`}>
                        <Icon name='Spoiler' className={classes.closeIcon} />
                    </Tooltip>
                </div>
                <div className={classes.separator} />
                <div onClick={() => {
                    quotedUsers = []
                    FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                    this.forceUpdate()
                }}>
                    <Tooltip text='Close' className={classes.closeButton}>
                        <Icon name='CloseCircle' className={classes.closeIcon} />
                    </Tooltip>
                </div>
            </div>
        </div>
    }

    renderMessages() {
        return quotedUsers.map((e, i) => <>
            {e.props.isGroupStart && i ? <Divider /> : null}
            <div className={`modifiedQuote${e.props.isGroupStart ? '' : ' stackedQuote'}`}>
                {e}
                <div
                    className='removeQuote'
                    onClick={() => {
                        quotedUsers.splice(i, 1)
                        FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                        this.forceUpdate()
                    }}
                ><Tooltip position='left' text='Cancel Quoting Message'><Icon name='Trash' color='var(--interactive-normal)' /></Tooltip></div>
            </div>
        </>)
    }

    renderPreview() {
        return <div className={`${classes.markup} quotePreview`}>{parser.parse(this.props.createQuotes(quotedUsers))}</div>
    }

    render() {
        if (!quotedUsers.length) return null

        let authors = [] // [{ id, name, color }]
        for (let i = 0; i < quotedUsers.length; i++) {
            if (i && quotedUsers[i].props.message.author.id === quotedUsers[i - 1].props.message.author.id) {
                quotedUsers[i].props.isGroupStart = false
                const previous = quotedUsers[i - 1].props
                quotedUsers[i].props.group = previous.group || previous.message.id
            } else {
                const { props: { message }, props } = quotedUsers[i]
                props.isGroupStart = true
                if (!authors.find(a => a.id === message.author.id)) authors.push({
                    id: message.author.id,
                    name: message.nick || message.author.username,
                    color: message.colorString
                })
            }
        }
        authors = _.sortBy(authors, 'name')

        return <div className='quoteContainer'>
            {this.renderHeader(authors)}
            <div className={`${classes.auto} ${classes.scrollerBase} quoteMessages`}>
                {preview ? this.renderPreview() : this.renderMessages()}
            </div>
        </div>
    }
}
