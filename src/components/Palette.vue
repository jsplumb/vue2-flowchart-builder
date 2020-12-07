<template>
    <div class="sidebar node-palette">
        <div class="sidebar-item" :data-node-type="entry.type" title="Drag to add new" v-for="entry in data" :key="entry.type">
            <i :class="entry.icon"></i>{{entry.label}}
        </div>
    </div>
</template>

<script>

    import { SurfaceDrop } from 'jsplumbtoolkit-vue2-drop';

    export default {
        mixins:[ SurfaceDrop ],
        data:function() {
            return {
                data:[
                    { icon:"icon-tablet", label:"Question", type:"question" },
                    { icon:"icon-eye-open", label:"Action", type:"action" },
                    { type:"output", icon:"icon-eye-open", label:"Output" }
                ]
            };
        }
    }

</script>