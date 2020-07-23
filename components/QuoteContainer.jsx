const { getModule, getModuleByDisplayName, React } = require("powercord/webpack")

const RemoveButton = getModuleByDisplayName("RemoveButton", false)
const dispatcher = getModule(["dispatch"], false)
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
        return <div className="quoteContainer">
            {quotedUsers.length > 1 ? <RemoveButton
                className="removeQuotes"
                onClick={() => {
                    quotedUsers = []
                    dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE2", quotedUsers })
                    this.forceUpdate()
                }}
            /> : null}
            {quotedUsers.map((e, i) => <div className="modifiedQuote">
                <RemoveButton
                    className="removeQuote"
                    onClick={() => {
                        quotedUsers.splice(i, 1)
                        dispatcher.dirtyDispatch({ type: "BETTER_QUOTER_UPDATE2", quotedUsers })
                        this.forceUpdate()
                    }}
                />
                {e}
            </div>)}
        </div>
    }
}
