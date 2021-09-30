const sBox = require('./tables/sBox')
const { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs')
const { ENCODE, DECODE } = require('./workingMode')
const ipReplacementTable = require('./tables/ipReplacementTable')
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
function initKi(key, mode = ENCODE) {
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
    mode === DECODE && Ki.reverse()
}


/**
 * 将两个二进制字符数组进行异或运算, 如['0', '1', '0']^['0', '0', '1']=['0', '1', '1']
 * @param {array} arr1 二进制字符数组1
 * @param {array} arr2 二进制字符数组2
 * @returns {array}
 */
function binaryArrayXOR(arr1, arr2) {
    const res = []
    for (let i = 0; i < arr1.length; i++) {
        res.push((arr1[i] ^ arr2[i]).toString())
    }

    return res
}


/**
 * 将长度为48的数组转换为带有8个长度为6的子数组的新数组
 * @param {array|string} arr 长度为48的字符数组或字符串
 * @returns {array} 返回带有8个子数组的新数组，其中每个子数组长度为6
 */
function sliceXORed(arr) {
    const res = [[], [], [], [], [], [], [], []]
    for (let i = 0; i < 48; i++) {
        const index = Math.floor(i / 6)
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
function strTransformBySBox(arr, sBoxIndex) {
    const row = parseInt(arr[0] + arr[5], 2)// s盒的行号
    const col = parseInt(arr.slice(1, 5).join(''), 2)// s盒的列号
    const binaryStr = sBox[sBoxIndex][row][col].toString(2)

    return Array.from('0'.repeat(4 - binaryStr.length) + binaryStr)
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
exports.DES = DES


/**
 * 加密和解密一个文件到另一个文件，如图片和文本文件
 * @param {string} src 被加密的文件名
 * @param {string} key 加密的密匙
 * @returns {array} [string, number] 密文和加密时左侧填充的0的个数
 */
function encodeFile(src, key = '0001001100110100010101110111100110011011101111001101111111110001') {
    try {
        const startTime = new Date().getTime()// 开始时间
        process.stdout.write(`正在加密${src}...`)
        const data = readFileSync(src, 'binary')

        // 将文本文件转换为二进制字符串数组, 类似['01100011', '01101111', ...]
        const binaryStr = []
        Buffer.from(data, 'binary').forEach(b => binaryStr.push(b.toString(2)))
        const binaryStrArray = binaryStr.map(b => '0'.repeat(8 - b.length) + b)

        // 前面需要补充多少个0
        const zerosPre = '00000000'.repeat(8 - binaryStrArray.length % 8)
        // 前面填好0后，形成明文, 一整个字符串，长度为64的倍数
        const M = zerosPre + binaryStrArray.join('')

        // 将明文进行加密密文
        const C = M.match(/[01]{64}/g).map(str => DES(key, str, ENCODE)).reduce((acc, arr) => acc.concat(arr.join('')), '')
        // console.log('密文', C)
        const endTime = new Date().getTime()// 结束时间
        console.log(`耗时${endTime - startTime}ms!`)

        return [C, zerosPre.length]
    } catch (err) {
        console.log(err)
        return
    }
}


/**
 * 将密文解密为原文
 * @param {string} str 被解密的密文
 * @param {number} leftTrim0Length 左侧去掉多少个填充的0
 * @param {string} key 解密的密匙
 * @returns {string} text 解密后的明文还原到原来的文本
 */
function decodeText(str, leftTrim0Length, key = '0001001100110100010101110111100110011011101111001101111111110001') {
    try {
        // // 解密后的明文
        const M1 = str.match(/[01]{64}/g).map(str => DES(key, str, DECODE)).reduce((acc, arr) => acc.concat(arr.join('')), '')

        // 将解密后的明文还原为原来的文本
        const subArrays = M1.match(/[01]{8}/g)// 8位一组分割
        subArrays.splice(0, leftTrim0Length / 8)// 去掉最左侧的填充的0
        // 原来的文本
        const text = Buffer.from(subArrays.map(str => parseInt(str, 2))).toString('binary')
        // console.log(text) 

        return text
    } catch (err) {
        console.log(err)
        return
    }
}


/**
 * 返回一棵树，{name:string, children: [{name:string, children:array, C:string, left:number}, ...], C:string, left:number}
 * @param {string} pathname 要遍历的路径
 * @param {Object} fileObj {name:string, children:array}
 * @returns {Object} 当pathname是一个文件名时，返回fileObj
 */
function encodeFiles(pathname, fileObj, key) {// fileObj: {name, children}
    try {
        const stats = statSync(pathname)
        fileObj.name = pathname
        fileObj.children = []

        if (stats.isDirectory()) {
            // 是文件夹类型，读取其中的文件及文件夹
            const files = readdirSync(pathname)
            for (const name of files) {
                const subFileObj = {}// 防止被回收
                // 递归
                encodeFiles(`${pathname}/${name}`, subFileObj, key)
                fileObj.children.push(subFileObj)
            }
        } else if (stats.isFile()) {
            // 是文件类型
            const [C, left] = encodeFile(pathname, key)
            fileObj.C = C
            fileObj.left = left

            return fileObj
        }
    } catch (err) {
        console.log(err)
        return
    }
}



/**
 * 传入一个JSON解析后的对象，递归还原文件和文件夹
 * @param {Object} fileObj 文件描述对象，是一棵树, {name:string, children: [{name:string, children:array, C:string, left:number}, ...], C:string, left:number}
 * @returns 
 */
function decodeFiles(fileObj, key){
    if(fileObj.children.length===0){
        // 文件类型
        const startTime = new Date().getTime()// 开始时间
        process.stdout.write(`正在解密${fileObj.name}...`)

        const {name, left, C} = fileObj
        const text = decodeText(C, left, key)
        try{
            if(!existsSync(name)){
                writeFileSync(name, text, 'binary')

                const endTime = new Date().getTime()// 结束时间
                console.log(`耗时${endTime - startTime}ms!`)
            }    
        }catch(err){
            console.log(err)
            return
        }
    }else{
        // 文件夹类型
        const {name} = fileObj
        if(!existsSync(name)){
            mkdirSync(name)
        }
        // 递归
        fileObj.children.forEach(child=>{
            decodeFiles(child, key)
        })
    }
}


/**
 * 传入一个文件路径或文件夹路径（当前目录中的路径），当前目录中会产生一个pathname.des.json文件
 * @param {string} pathname 被加密的文件路径或文件夹路径
 * @param {string} key 密匙, 64位01字符串
 */
function desEncode(pathname, key='0001001100110100010101110111100110011011101111001101111111110001'){
    const fileObj = {}// 防止被回收
    encodeFiles(pathname, fileObj, key)
    writeFileSync(`${pathname}.des.json`, JSON.stringify(fileObj))
}
exports.desEncode = desEncode



/**
 * 给一个.json文件，将它还原
 * @param {string} pathname 给出.json文件的路径来解密
 * @param {string} key 密匙, 64位01字符串
 */
function desDecode(pathname, key='0001001100110100010101110111100110011011101111001101111111110001'){
    decodeFiles(JSON.parse(readFileSync(pathname).toString()), key)
}
exports.desDecode = desDecode
