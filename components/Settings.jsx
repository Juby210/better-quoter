const { getModule, getModuleByDisplayName, React } = require("powercord/webpack")
const { Category } = require("powercord/components/settings")
const TextArea = getModuleByDisplayName("TextArea", false)
const FormItem = getModuleByDisplayName("FormItem", false)

const Replacer = require("./Replacer")
const replacers = require("../replacers.json")

module.exports = class Settings extends React.Component {
    constructor() {
        super()

        this.state = { categoryOpened: false }
    }

    render() {
        const { getSetting, updateSetting } = this.props
        const { getChannelId, getLastSelectedChannelId } = getModule(["getLastSelectedChannelId"], false)
        const { parse } = getModule(["parse", "parseTopic"], false)
        const { createQuotedText } = getModule(["createQuotedText"], false)

        return <>
            <FormItem style={{ marginBottom: "20px" }} title="Text to replace:"> 
                <TextArea autofocus={true} rows={8} placeholder="Text to replace:" value={getSetting('text', `> \`%name% - %time% in\` <#%channelId%>\n\`\`\`fix\n%msg%\n%files%\n\`\`\``)} onChange={e=>{
                    updateSetting('text', e)
                    this.setState({})
                }} />
            </FormItem>
            <Category name="Replace Parameter" description="Placeholder guide, to view all replace parameter." opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
                {replacers.map(r => <Replacer {...r} />)}
            </Category>
            <FormItem style={{ marginTop: "20px" }} title="Preview:">
                <div className={getModule(["markup"], false).markup}>
                    {parse(createQuotedText(
                        {
                            content: "Content of the message (1st line)\n2nd line",
                            attachments: [{ filename: "message.txt" }, { filename: "message1.txt" }],
                            author: { username: "You", id: getModule(["getCurrentUser"], false).getCurrentUser().id },
                            timestamp: { toDate: () => new Date }
                        },
                        {
                            name: "Some Channel",
                            id: getChannelId() || getLastSelectedChannelId()
                        }
                    ))}
                </div>
            </FormItem>
        </>
    }
}
