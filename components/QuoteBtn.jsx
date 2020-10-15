const { React, i18n: { Messages } } = require('powercord/webpack')
const { Tooltip, Icon } = require('powercord/components')

module.exports = ({ Button, onClick }) => Button && onClick ? <Tooltip className='betterQuoterBtn' text={Messages.QUOTE}>
    <Button onClick={onClick}>
        <Icon name='BlockQuote' width='20' />
    </Button>
</Tooltip> : null
