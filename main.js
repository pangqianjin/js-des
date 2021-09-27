const { ENCODE, DECODE } = require('./workingMode')
const ipReplacementTable = require('./tables/ipReplacementTable')
const { binaryArrayXOR, sliceXORed, strTransformBySBox } = require('./utils')
const keyReplacementTable = require('./tables/keyReplacementTable')
const compressTable = require('./tables/compressTable')
const shiftLeftTable = require('./tables/shiftLeftTable')
const expansionTable = require('./tables/expansionTable')
const pBox = require('./tables/pBox')
const finalTable = require('./tables/finalTable')

/**
 * F函数
 * @param {array} R 长度为32的字符数组
 * @param {array} K 长度为48的字符数组
 * @returns {array} R从32位拓展置换到48位，K压缩置换后还是48位，二者再异或运算，然后S盒置换，P盒置换
 */
function F(R, K) {
    // E盒拓展置换
    const expandedR = expansionTable.map(index => R[index - 1])
    // 异或运算
    const XORed = binaryArrayXOR(K, expandedR)
    // S盒置换
    const sBoxTransformed = sliceXORed(XORed).reduce((acc, subArr, index) => acc.concat(strTransformBySBox(subArr, `s${index + 1}`)), [])
    // P盒置换
    const pBoxTransformed = pBox.map(index => sBoxTransformed[index - 1])

    return pBoxTransformed
}



// K1-K15
const Ki = []
/**
 * 初始化Ki数组
 * @param {string} key 初始提供的密钥
 * @param {string} mode 加密模式还是解密模式
 */
function initKi(key, mode=ENCODE) {
    // 置换后的56位key，不包含8个奇偶校验位
    const replacedKey = keyReplacementTable.map(index => key[index - 1])
    const Ci = replacedKey.slice(0, 28)
    const Di = replacedKey.slice(28)

    for (let i = 0; i < 16; i++) {
        // Ci和Di循环左移j次
        for (let j = 0; j < shiftLeftTable[i]; j++) {
            Ci.push(Ci.shift())
            Di.push(Di.shift())
        }
        // Ci和Di压缩成48位
        const CiDi = Ci.concat(Di)
        const K = compressTable.map(index => CiDi[index - 1])
        Ki.push(K)
    }
    mode===DECODE && Ki.reverse()
}

/**
 * 
 * @param {array} key DES算法的工作密匙，64位
 * @param {array} data 要被加密或被解密的数据，64位
 * @param {string} mode DES的工作模式
 */
function DES(key, data, mode = ENCODE) {
    // IP置换
    const replacedData = ipReplacementTable.map(index => data[index - 1])
    const L0 = replacedData.slice(0, 32)
    const R0 = replacedData.slice(32)
    // Ki的初始化
    initKi(key, mode)

    // Li和Ri的初始化
    let Li = L0
    let Ri = R0
    let tmp

    // 16轮迭代
    for (let i = 0; i < 16; i++) {
        const K = Ki[i]
        const f = F(Ri, K)
        
        tmp = Li
        Li = Ri
        Ri = binaryArrayXOR(tmp, f)
    }
    // 最终置换
    const RiLi = Ri.concat(Li)
    const finalTransformed = finalTable.map(index => RiLi[index - 1])
    
    // 验证加密
    // console.log(finalTransformed.join('')==='1000010111101000000100110101010000001111000010101011010000000101')

    // 验证解密
    // console.log(finalTransformed.join('')==='0000000100100011010001010110011110001001101010111100110111101111')
    return finalTransformed
}
module.exports = DES
// 加密
// 结果为: 1000010111101000000100110101010000001111000010101011010000000101
DES('0001001100110100010101110111100110011011101111001101111111110001',
    '0000000100100011010001010110011110001001101010111100110111101111', ENCODE)

// 解密
// DES('0001001100110100010101110111100110011011101111001101111111110001', 
//     '1000010111101000000100110101010000001111000010101011010000000101', DECODE)