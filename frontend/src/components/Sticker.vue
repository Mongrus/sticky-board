<script setup>
    defineProps({
        sticker: Object
    })

</script>

<template>
    <textarea 
    class="sticker"
    :key="sticker.id" 
    :style="{
        backgroundColor: sticker.bc,
        fontSize: sticker.fs,
        width: sticker.w  + 'px', 
        height: sticker.h  + 'px',
        left: sticker.x  + 'px',
        top: sticker.y + 'px'
        }"
        >
        {{ sticker.text }}
    </textarea>
</template>

<style lang="sass" scoped>

.sticker
    position: absolute

</style>