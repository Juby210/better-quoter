const { getModuleByDisplayName, FluxDispatcher, React } = require('powercord/webpack')
const { Tooltip, Icon } = require('powercord/components')

const RemoveButton = getModuleByDisplayName('RemoveButton', false)
let quotedUsers = []

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
        for (let i = 0; i < quotedUsers.length; i++) {
            if (i && quotedUsers[i].props.message.author.id == quotedUsers[i - 1].props.message.author.id) {
                quotedUsers[i].props.isGroupStart = false
                const previous = quotedUsers[i - 1].props
                quotedUsers[i].props.group = previous.group || previous.message.id
            } else quotedUsers[i].props.isGroupStart = true
        }
        return <div className={`quoteContainer${quotedUsers.length ? ' quoting' : ''}`}>
            {quotedUsers.length ? <Tooltip position='left' text='Cancel Quote' className='removeQuotes'>
                <RemoveButton
                    onClick={() => {
                        quotedUsers = []
                        FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                        this.forceUpdate()
                    }}
                />
            </Tooltip> : null}
            {quotedUsers.map((e, i) => <div className='modifiedQuote'>
                {e.props.isGroupStart && quotedUsers[i + 1] && !quotedUsers[i + 1].props.isGroupStart ?
                    <Tooltip position='right' text='Cancel Quoting Group' className='removeGroupQuote'>
                        <RemoveButton
                            onClick={() => {
                                quotedUsers.splice(i, 1)
                                quotedUsers = quotedUsers.filter(m => m.props.group != e.props.message.id)
                                FluxDispatcher.dirtyDispatch({ type: 'BETTER_QUOTER_UPDATE2', quotedUsers })
                                this.forceUpdate()
                            }} 
                        />
                    </Tooltip>
                : null}
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
    }
}
