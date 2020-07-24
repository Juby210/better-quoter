const { getModule, getModuleByDisplayName, React } = require("powercord/webpack")
const { Tooltip } = require("powercord/components")

const RemoveButton = getModuleByDisplayName("RemoveButton", false)
const dispatcher = getModule(["dispatch"], false)
const getIcon = getModule(m => m.id && typeof m.keys == "function" && m.keys().includes("./Activity"), false)
const Trash = getIcon ? getIcon("./Trash").default : null
let quotedUsers = []

module.exports = class QuoteContainer extends React.Component {
    constructor(props) {
        super(props)
        dispatcher.subscribe("BETTER_QUOTER_UPDATE", this.subscribe = data => {
            quotedUsers = data.quotedUsers
            this.forceUpdate()
        })
    }

    componentWillUnmount() {
        if (this.subscribe) dispatcher.unsubscribe("BETTER_QUOTER_UPDATE", this.subscribe)
    }

    render() {
        for (let i = 0; i < quotedUsers.length; i++) {
            if (i && quotedUsers[i].props.message.author.id == quotedUsers[i - 1].props.message.author.id) {
                quotedUsers[i].props.isGroupStart = false
                const previous = quotedUsers[i - 1].props
                quotedUsers[i].props.group = previous.group || previous.message.id
            } else quotedUsers[i].props.isGroupStart = true
        }
        return <div className="quoteContainer">
            {quotedUsers.length ? <Tooltip text="Cancel Quote" className="removeQuotes">
                <RemoveButton
                    onClick={() => {
                        quotedUsers = []
                        dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE2", quotedUsers })
                        this.forceUpdate()
                    }}
                />
            </Tooltip> : null}
            {quotedUsers.map((e, i) => <div className="modifiedQuote">
                {quotedUsers.length > 1 && e.props.isGroupStart ? <Tooltip text="Cancel Quoting Group" className="removeQuote">
                    <RemoveButton
                        onClick={() => {
                            quotedUsers.splice(i, 1)
                            quotedUsers = quotedUsers.filter(m => m.props.group != e.props.message.id)
                            dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE2", quotedUsers })
                            this.forceUpdate()
                        }}
                    />
                </Tooltip> : null}
                {e}
                {!e.props.isGroupStart || quotedUsers[i + 1] && !quotedUsers[i + 1].props.isGroupStart ? <div
                    className="removeStackedQuote"
                    onClick={() => {
                        quotedUsers.splice(i, 1)
                        dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE2", quotedUsers })
                        this.forceUpdate()
                    }}
                ><Tooltip text="Cancel Quoting Message"><Trash color="#f04747" /></Tooltip></div> : null}
            </div>)}
        </div>
    }
}
