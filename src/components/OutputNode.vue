<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-output" data-jtk-target="true">
        <div style="position:relative">

            <svg :width="obj.w" :height="obj.h">
                <rect x="0" y="0" :width="obj.w" :height="obj.h" rx="5" ry="5"/>
                <text text-anchor="middle" :x="obj.w/2" :y="obj.h/2" dominant-baseline="central">{{obj.text}}</text>
            </svg>
            <div class="node-edit node-action" v-on:click="edit"></div>
            <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>
        </div>
    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>
