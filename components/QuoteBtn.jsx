const { React, getModule, i18n: { Messages } } = require("powercord/webpack")
const { Tooltip } = require("powercord/components")

const getIcon = getModule(m => m.id && typeof m.keys == "function" && m.keys().includes("./Activity"), false)
const BlockQuote = getIcon ? getIcon("./BlockQuote").default : null

module.exports = ({ Button, Separator }) => class QuoteBtn extends React.Component {
    render() {
        if (!Button || !Separator) return null
        return <>
            <Tooltip text={Messages.QUOTE}>
                <Button onClick={this.props.onClick.bind(this)}>
                    <BlockQuote />
                </Button>
            </Tooltip>
            <Separator />
        </>
    }
}
