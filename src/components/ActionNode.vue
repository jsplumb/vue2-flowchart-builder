<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-action">
        <div style="position:relative">

            <svg :width="obj.w" :height="obj.h">
                <rect x="10" y="10" :width="obj.w-20" :height="obj.h-20" class="inner"/>
                <text text-anchor="middle" :x="obj.w/2" :y="obj.h/2" dominant-baseline="central">{{obj.text}}</text>
            </svg>

            <div class="node-edit node-action" v-on:click="edit"></div>
            <div class="node-delete node-action delete" v-on:click="maybeDelete"></div>

        </div>

        <div class="drag-start connect"></div>
        <jtk-target port-type="target" v-pre/>
        <jtk-source port-type="source" filter=".connect" v-pre/>
    </div>
</template>

<script>
    import BaseEditableNode from './BaseEditableNode.vue'
    export default {
        mixins:[BaseEditableNode]
    }
</script>
