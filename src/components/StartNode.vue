<template>
    <div v-bind:style="{left:obj.left + 'px', top:obj.top + 'px', width:obj.w + 'px', height:obj.h + 'px'}" class="flowchart-object flowchart-start">
        <div style="position:relative">
            <svg :width="obj.w" :height="obj.h">
                <ellipse :cx="obj.w/2" :cy="obj.h/2" :rx="(obj.w/2) - 10" :ry="(obj.h/2) - 10" class="inner"/>
                <text text-anchor="middle" :x="obj.w / 2" :y="obj.h / 2" dominant-baseline="central">{{obj.text}}</text>
            </svg>

        </div>
        <div class="drag-start connect" data-jtk-source="true"></div>
    </div>
</template>

<script>
    export default { }
</script>
