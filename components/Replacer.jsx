const { getModuleByDisplayName, React } = require("powercord/webpack")
const FormItem = getModuleByDisplayName("FormItem", false)
const FormText = getModuleByDisplayName("FormText", false)

module.exports = ({ selector, desc }) => <>
    <FormItem style={{ marginBottom: "10px" }} title={`%${selector}%`}>
        <FormText>{desc}</FormText>
    </FormItem>
</>
