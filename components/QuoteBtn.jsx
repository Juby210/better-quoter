const { React, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack')
const { Tooltip } = require('powercord/components')

const BlockQuote = getModuleByDisplayName('BlockQuote', false)

module.exports = ({ Button, onClick }) => Button && onClick ? <Tooltip className='betterQuoterBtn' text={Messages.QUOTE}>
    <Button onClick={onClick}>
        {/* <Icon name='BlockQuote' width='20' /> */}
        <BlockQuote width='20' />
    </Button>
</Tooltip> : null
