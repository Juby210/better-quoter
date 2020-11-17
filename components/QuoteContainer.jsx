const { getModule, FluxDispatcher, React } = require('powercord/webpack')
const { Divider, Tooltip, Icon } = require('powercord/components')

let quotedUsers = []

const classes = {
    ...getModule(['actions', 'container'], false),
    ...getModule(['colorHeaderSecondary'], false)
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
        for (let i = 0; i < quotedUsers.length; i++) {
            if (i && quotedUsers[i].props.message.author.id == quotedUsers[i - 1].props.message.author.id) {
                quotedUsers[i].props.isGroupStart = false
                const previous = quotedUsers[i - 1].props
                quotedUsers[i].props.group = previous.group || previous.message.id
            } else quotedUsers[i].props.isGroupStart = true
        }
        return <div className={`${classes.container} quoteContainer quoting`}>
            <div className={`${classes.colorHeaderSecondary} ${classes.text}`}>
                {quotedUsers.map((e, i) => <div className='modifiedQuote'>
                    {e.props.isGroupStart && i ? <Divider /> : null}
                    {e}
                    {quotedUsers.length > 1 ? <div
                        className='removeQuote'
                        onClick={() => {
                            quotedUsers.splice(i, 1)
                            FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                            this.forceUpdate()
                        }}
                    ><Tooltip position='left' text='Cancel Quoting Message'><Icon name='Trash' color='var(--interactive-normal)' /></Tooltip></div> : null}
                </div>)}
            </div>
            <div className={classes.actions}>
                <Tooltip position='left' text='Cancel Quote' className={classes.closeButton}>
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
    }
}
