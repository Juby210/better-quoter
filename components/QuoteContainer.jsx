const { getModule, FluxDispatcher, React } = require('powercord/webpack')
const { Divider, Tooltip, Icon } = require('powercord/components')

let quotedUsers = []

const classes = {
    ...getModule(['actions', 'container'], false),
    ...getModule(['colorHeaderSecondary'], false),
    ...getModule(['auto', 'scrollerBase'], false),
    ...getModule(['size14'], false)
}

module.exports = class QuoteContainer extends React.Component {
    constructor(props) {
        super(props)
        FluxDispatcher.subscribe('BETTER_QUOTER_UPDATE', this.subscribe = data => {
            quotedUsers = data.quotedUsers
            this.forceUpdate()
        })
    }

    componentWillUnmount() {
        if (this.subscribe) FluxDispatcher.unsubscribe('BETTER_QUOTER_UPDATE', this.subscribe)
    }

    render() {
        if (!quotedUsers.length) return null

        let authors = []
        for (let i = 0; i < quotedUsers.length; i++) {
            if (i && quotedUsers[i].props.message.author.id === quotedUsers[i - 1].props.message.author.id) {
                quotedUsers[i].props.isGroupStart = false
                const previous = quotedUsers[i - 1].props
                quotedUsers[i].props.group = previous.group || previous.message.id
            } else {
                quotedUsers[i].props.isGroupStart = true
                if (!authors.includes(quotedUsers[i].props.message.author)) authors.push(quotedUsers[i].props.message.author)
            }
        }
        authors = _.sortBy(authors, 'username')

        return <div className='quoteContainer'>
            <div className={`${classes.container} quoteHeader`}>
                <div className={`${classes.colorHeaderSecondary} ${classes.size14} ${classes.text}`}>
                    {/* TODO: role color and maybe nicknames? :p */}
                    Quoting {authors.reduce((items, item, index, _this) => {
                    if (_this.length === 1) return items.concat(<span class={classes.name}>{item.username}</span>)
                    if (index === _this.length - 1) items.push(' and ')
                    return items.concat(<span class={classes.name}>{item.username}</span>, index === _this.length - 1 || index === _this.length - 2 ? null : ', ').filter(e => e)
                }, [])}
                </div>
                <div className={classes.actions}>
                    <Tooltip text='Close' className={classes.closeButton}>
                        <Icon
                            name='CloseCircle'
                            className={classes.closeIcon}
                            onClick={() => {
                                quotedUsers = []
                                FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                                this.forceUpdate()
                            }}
                        />
                    </Tooltip>
                </div>
            </div>
            <div className={`${classes.auto} ${classes.scrollerBase} quoteMessages`}>
                {quotedUsers.map((e, i) => <>
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
                </div></>)}
            </div>
        </div>
    }
}
