const sBox = require('./tables/sBox')


/**
 * 将任意字符串转换为一个二进制字符数组，长度大于等于8且无上限
 * @param {string} str 被解析的字符串
 * @param {string} encoding 编码方式，默认为utf-8
 * @returns {array} 返回值为一个字符串数组，其中每一个字符串都是长度为8的0/1字符串
 */
exports.str2binaryArray = function(str, encoding='utf-8') {
    const bytes = new TextEncoder(encoding, { NONSTANDARD_allowLegacyEncoding: true }).encode(str)
    const binaryStr = []
    bytes.forEach(b=>binaryStr.push(b.toString(2)))
    
    return binaryStr.map(b=>('0'.repeat(8-b.length)+b))
}


/**
 * 将一个0/1字符串转换为它原本的文本
 * @param {string} str 0/1字符串
 * @param {string} encoding 编码方式，默认为utf-8
 * @returns {string}
 */
 exports.binaryArray2Str = function(str, encoding='utf-8'){
    const bin = str.match(/[01]{8}/g)// 类似于['11100100', '10111101', '10100000', ...]
    const bytes = new Uint8Array(bin.map(b=>parseInt(b, 2)))
    const txt = new TextDecoder(encoding, { NONSTANDARD_allowLegacyEncoding: true }).decode(bytes)

    return txt
}


/**
 * 将两个二进制字符数组进行异或运算, 如['0', '1', '0']^['0', '0', '1']=['0', '1', '1']
 * @param {array} arr1 二进制字符数组1
 * @param {array} arr2 二进制字符数组2
 * @returns {array}
 */
exports.binaryArrayXOR = function(arr1, arr2){
    const res = []
    for(let i=0;i<arr1.length;i++){
        res.push((arr1[i]^arr2[i]).toString())
    }
    
    return res
}


/**
 * 将长度为48的数组转换为带有8个长度为6的子数组的新数组
 * @param {array|string} arr 长度为48的字符数组或字符串
 * @returns {array} 返回带有8个子数组的新数组，其中每个子数组长度为6
 */
exports.sliceXORed = function(arr){
    const res = [[],[],[],[],[],[],[],[]]
    for(let i=0;i<48;i++){
        const index = Math.floor(i/6)
        res[index].push(arr[i])
    }
    return res
}


/**
 * s盒转换，根据sBoxIndex的值确定是哪个s盒, 将一个长度为6的字符数组进行s盒转换，并返回长度为4的字符数组
 * @param {array} arr 待转换的字符数组，长度为6
 * @param {string} sBoxIndex 可选值: 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'
 * @returns {array} 返回一个s盒中对应的十进制数的二进制形式的字符数组，长度为4
 */
exports.strTransformBySBox = function(arr, sBoxIndex){
    const row = parseInt(arr[0]+arr[5], 2)// s盒的行号
    const col = parseInt(arr.slice(1, 5).join(''), 2)// s盒的列号
    const binaryStr = sBox[sBoxIndex][row][col].toString(2)

    return Array.from('0'.repeat(4-binaryStr.length)+binaryStr)
}

