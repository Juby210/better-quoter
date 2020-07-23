const { getModule, getModuleByDisplayName, channels, React } = require("powercord/webpack")
const { AsyncComponent, Flex } = require("powercord/components")
const { Category, SelectInput, SwitchItem } = require("powercord/components/settings")
const ChannelMessage = getModule(m => m.type && m.type.displayName == "ChannelMessage", false)
const TextArea = getModuleByDisplayName("TextArea", false)
const FormItem = getModuleByDisplayName("FormItem", false)
const FormText = getModuleByDisplayName("FormText", false)

const Replacer = require("./Replacer")
const replacers = require("../replacers.json")

class Settings extends React.Component {
    constructor(props) {
        super(props)

        this.state = { categoryOpened: false }
    }

    render() {
        const { getSetting, updateSetting, toggleSetting, modules } = this.props
        const cUser = modules.getCurrentUser(), channel_id = channels.getChannelId() || channels.getLastSelectedChannelId()
        const channel = new modules.Channel({ name: "testing", id: channel_id, guild_id: modules.getGuildId() || modules.getLastSelectedGuildId() })
        const user = new modules.User({ username: "Example User" })
        const ExampleMessage = <ChannelMessage
            message={new modules.Message({ author: user, content: `hi <@${cUser.id}>!\nthis is second line of my message`, attachments: [{ filename: "test.jsx" }], channel_id })}
            channel={channel}
        />
        const ExampleMessage2 = <ChannelMessage message={new modules.Message({ author: user, content: "second message", channel_id })} channel={channel} />
        const message = new modules.Message({ author: cUser, content: this.props.createQuotes([ ExampleMessage, ExampleMessage2 ]), channel_id })

        return <>
            <FormItem style={{ marginBottom: "20px" }} title="Format:">
                <TextArea
                    autofocus={true}
                    rows={6}
                    placeholder="Format"
                    value={getSetting("text", "> `%name% - %time%` in <#%channelid%>\n%quote%\n%files%")}
                    onChange={e => updateSetting("text", e)}
                />
            </FormItem>
            <FormItem style={{ marginBottom: "20px" }} title="Stacked Message Format:">
                <TextArea
                    autofocus={false}
                    rows={2}
                    placeholder="Format"
                    value={getSetting("stackedFormat", "%quote%")}
                    onChange={e => updateSetting("stackedFormat", e)}
                    disabled={getSetting("classicMode")}
                />
                {getSetting("classicMode") ? <FormText>Stacking messages isn't supported in classic mode yet</FormText> : null}
            </FormItem>
            <Category name="Replace Parameter" description="Placeholder guide, to view all replace parameter." opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
                {replacers.map(r => <Replacer {...r} />)}
            </Category>
            <SwitchItem
                value={getSetting("classicMode")}
                onChange={() => {
                    toggleSetting("classicMode")
                    this.props.repatch()
                }}
                note="If this option is turned off quotes are shown above text area"
            >Classic mode</SwitchItem>
            <Flex>
                <Flex.Child>
                    <div><SelectInput
                        options={[
                            { label: "Keep mentions", value: 0 },
                            { label: "Insert mentions into (small) code block", value: 1 },
                            { label: "Replace @ with `@`", value: 2 }
                        ]}
                        value={getSetting("replaceMentions", 0)}
                        onChange={o => updateSetting("replaceMentions", o.value)}
                    >Replace mentions</SelectInput></div>
                </Flex.Child>
                {getSetting("replaceMentions", 0) ? <SwitchItem
                    value={getSetting("showFullTagInMentions", true)}
                    onChange={() => toggleSetting("showFullTagInMentions", true)}
                    style={{ marginTop: "32px", maxHeight: "63px" }}
                >Show full tag in mentions</SwitchItem> : null}
            </Flex>
            <FormItem title="Preview:">
                {ExampleMessage}
                <div style={{ marginBottom: "15px" }} />
                {ExampleMessage2}
                <div style={{ marginBottom: "15px" }} />
                <ChannelMessage message={message} channel={channel} />
            </FormItem>
        </>
    }
}

module.exports = props => <AsyncComponent _provider={async () => {
    const { getGuildId, getLastSelectedGuildId } = await getModule(["getLastSelectedGuildId"])
    props.modules = {
        getCurrentUser: (await getModule(["getCurrentUser"])).getCurrentUser,
        getGuildId, getLastSelectedGuildId,
        Channel: await getModule(m => m.prototype && m.prototype.isCategory && m.prototype.isOwner),
        Message: await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM),
        User: await getModule(m => m.prototype && m.prototype.tag)
    }
    return () => <Settings {...props} />
}} />
