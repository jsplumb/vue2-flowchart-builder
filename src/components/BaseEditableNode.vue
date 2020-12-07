<script>

    import { Dialogs } from 'jsplumbtoolkit'
    import { BaseNodeComponent } from 'jsplumbtoolkit-vue2'

    export default {
        mixins:[ BaseNodeComponent ],
        methods:{
            edit:function() {
                let node = this.getNode();
                Dialogs.show({
                    id: "dlgText",
                    data: node.data,
                    title: "Edit " + node.data.type + " name",
                    onOK: (data) => {
                        if (data.text && data.text.length > 2) {
                            // if name is at least 2 chars long, update the underlying data and
                            // update the UI.
                            this.updateNode(data);
                        }
                    }
                });
            },
            maybeDelete:function() {
                let node = this.getNode();
                Dialogs.show({
                    id: "dlgConfirm",
                    data: {
                        msg: "Delete '" + node.data.text + "'"
                    },
                    onOK:() => {
                        this.removeNode();
                    }
                });
            }
        }
    }

</script>