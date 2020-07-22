const { getModule, getModuleByDisplayName, channels, React } = require("powercord/webpack")
const { AsyncComponent, Flex } = require("powercord/components")
const { Category, SelectInput, SwitchItem } = require("powercord/components/settings")
const TextArea = getModuleByDisplayName("TextArea", false)
const FormItem = getModuleByDisplayName("FormItem", false)

const Replacer = require("./Replacer")
const replacers = require("../replacers.json")

class Settings extends React.Component {
    constructor(props) {
        super(props)

        this.state = { categoryOpened: false }
    }

    render() {
        const { getSetting, updateSetting, toggleSetting, modules } = this.props
        const user = modules.getCurrentUser()

        return <>
            <FormItem style={{ marginBottom: "20px" }} title="Text to replace:"> 
                <TextArea autofocus={true} rows={8} placeholder="Text to replace:" value={getSetting("text", "> `%name% - %time%` in <#%channelid%>\n%quote%\n%files%")} onChange={e=>{
                    updateSetting('text', e)
                    this.setState({})
                }} />
            </FormItem>
            <Category name="Replace Parameter" description="Placeholder guide, to view all replace parameter." opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
                {replacers.map(r => <Replacer {...r} />)}
            </Category>
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
                <div className={modules.classes.markup}>
                    {modules.parse(modules.quote(
                        {
                            content: `Content of the message (1st line)\n2nd line <@${user.id}>`,
                            attachments: [{ filename: "message.txt" }, { filename: "message1.txt" }],
                            author: { username: "You", id: user.id },
                            timestamp: { toDate: () => new Date }
                        },
                        {
                            name: "Some Channel",
                            id: channels.getChannelId() || channels.getLastSelectedChannelId(),
                            isDM: () => false
                        }
                    ))}
                </div>
            </FormItem>
        </>
    }
}

module.exports = props => <AsyncComponent _provider={async () => {
    props.modules = {
        classes: await getModule(["markup"]),
        parse: (await getModule(["parse", "parseTopic"])).parse,
        quote: (await getModule(["createQuotedText"])).createQuotedText,
        getCurrentUser: (await getModule(["getCurrentUser"])).getCurrentUser
    }
    return () => <Settings {...props} />
}} />
