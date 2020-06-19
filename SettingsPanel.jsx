const { React, getModuleByDisplayName, getModule } = require('powercord/webpack');
const { Category } = require('powercord/components/settings');
const FormItem = getModuleByDisplayName("FormItem", false);
const FormText = getModuleByDisplayName("FormText", false);
const TextArea = getModuleByDisplayName("TextArea", false);
const { parse } = getModule(['parse', 'parseTopic'], false);
class Replacer extends React.Component {
    render() {
        return (
            <FormItem title={this.props.title}>
                <FormText>{this.props.text}</FormText>
            </FormItem>
        )
    }
}
module.exports = class SettingsPanel extends React.Component {
    constructor() {
        super();
        this.state = {categoryOpened: false}
    }
    render() {
        const { getSetting, updateSetting } = this.props;
        return (
            <div>
                <FormItem title="Text to replace:"> 
                <TextArea autofocus={true} rows={1} className="bq-Textarea" placeholder="Text to replace:" value={getSetting('text', `> \`%name% - %time% in\` <#%channelId%>\n\`\`\`fix\n%msg%\n%files%\n\`\`\``)} onChange={e=>{
                    updateSetting('text', e);
                    this.setState({});
                }} />
                </FormItem>
                <div style={{height: "20px"}}></div>
                <Category name='Replace Parameter' description="Placeholder guide, to view all replace parameter." opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
                    <Replacer title="%name%" text="Used to get the name from the author."/>
                    <hr/>
                    <Replacer title="%time%" text="Used to get the timestamp from the message."/>
                    <hr/>
                    <Replacer title="%msg%" text="Used to get the content from the message."/>
                    <hr/>
                    <Replacer title="%channel%" text="Used to get the name from channel where the message was send."/>
                    <hr/>
                    <Replacer title="%channelid%" text="Used to get the id from channel where the message was send."/>
                    <hr/>
                    <Replacer title="%files%" text="Used to get all the attachments send in the message. Replaced with: [filename.txt]"/>
                </Category>
                <div style={{height: "20px"}}></div>
                <FormItem title="Preview:">
                    <div className={getModule(["markup"], false).markup}>
                        {parse(this.parseMessage({content: "Content of the message", attachments: [{filename: "message.txt"}, {filename: "message1.txt"}], author: "You", timestamp: new Date()}, {name: "Some Channel", id: getModule(["getLastSelectedChannelId"], false).getLastSelectedChannelId()}))}
                    </div>
                </FormItem>
            </div>
        );
    }
    parseMessage(message, channel) {
        const { getSetting } = this.props;
        return getSetting('text', `> \`%name% - %time% in\` <#%channelId%>\n\`\`\`fix\n%msg%\n%files%\n\`\`\``).replace(/%msg%/g, message.content)
            .replace(/%name%/gi, message.author)
            .replace(/%time%/gi, new Date(message.timestamp).toLocaleString())
            .replace(/%channelid%/gi, channel.id)
            .replace(/%channel%/gi, channel.name)
            .replace(/%files%/gi, message.attachments.map(e=>`[${e.filename}]`).join(" "))
    }
}
