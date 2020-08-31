const { React, getModule, i18n: { Messages } } = require("powercord/webpack")
const { Tooltip } = require("powercord/components")

const getIcon = getModule(m => m.id && typeof m.keys == "function" && m.keys().includes("./Activity"), false)
const BlockQuote = getIcon ? getIcon("./BlockQuote").default : null

module.exports = ({ Button, onClick }) => Button && onClick ? <Tooltip className="betterQuoterBtn" text={Messages.QUOTE}>
    <Button onClick={onClick}>
        <BlockQuote width="20" />
    </Button>
</Tooltip> : null
