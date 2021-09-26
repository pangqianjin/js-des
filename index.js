const DES = require('./main')
const fs = require('fs')
const {str2binaryArray, binaryArray2Str} = require('./utils')
const { ENCODE, DECODE } = require('./workingMode')

// 加密和解密文本文件
fs.readFile('./utils.js', 'utf-8', (err, data)=>{
    if(err){
        console.log(err)
        return 
    }

    // 将文本文件转换为二进制字符串数组, 类似['01100011', '01101111', ...]
    const binaryStrArray = str2binaryArray(data.toString())
    // 前面需要补充多少个0
    const zerosPre = '00000000'.repeat(8-binaryStrArray.length%8)

    // 前面填好0后，形成明文, 一整个字符串，长度为64的倍数
    const M = zerosPre + binaryStrArray.join('')
    // 密匙
    const key = '0001001100110100010101110111100110011011101111001101111111110001'

    // 将明文进行加密密文
    const C = M.match(/[01]{64}/g).map(str=>DES(key, str, ENCODE)).reduce((acc, arr)=>acc.concat(arr.join('')), '')
    // console.log('密文', C)

    // 解密后的明文
    const M1 = C.match(/[01]{64}/g).map(str=>DES(key, str, DECODE)).reduce((acc, arr)=>acc.concat(arr.join('')), '')
    // 将解密后的明文还原为原来的文本
    const text = binaryArray2Str(M1)
    console.log(text)
})
