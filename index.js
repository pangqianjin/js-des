const { desEncode, DES, desDecode } = require('./utils')
const {ENCODE, DECODE} = require('./workingMode')
const key = '0001001100110100010101110111100110011011101111001101111111110001'

// 加密64位01串
// 结果为: 1000010111101000000100110101010000001111000010101011010000000101
// DES(key, '0000000100100011010001010110011110001001101010111100110111101111', ENCODE)

// 解密64位01串
// 结果为：0000000100100011010001010110011110001001101010111100110111101111
// DES(key, '1000010111101000000100110101010000001111000010101011010000000101', DECODE)


// 加密和解密字符串
const str = '落霞与孤鹜齐飞，秋水共长天一色。Hello, world!'
const binaryStr = []
Buffer.from(str).forEach(b => binaryStr.push(b.toString(2)))
const binaryStrArray = binaryStr.map(b => '0'.repeat(8 - b.length) + b)
// 前面需要补充多少个0
const zerosPre = '00000000'.repeat(8 - binaryStrArray.length % 8)
// 前面填好0后，形成明文, 一整个字符串，长度为64的倍数
const M = zerosPre + binaryStrArray.join('')

// 将明文进行加密密文
const C = M.match(/[01]{64}/g).map(str => DES(key, str, ENCODE)).reduce((acc, arr) => acc.concat(arr.join('')), '')
console.log('密文:', C)

const M1 = C.match(/[01]{64}/g).map(str => DES(key, str, DECODE)).reduce((acc, arr) => acc.concat(arr.join('')), '')
// 将解密后的明文还原为原来的文本
const subArrays = M1.match(/[01]{8}/g)// 8位一组分割
subArrays.splice(0, zerosPre.length / 8)// 去掉最左侧的填充的0
// 原来的文本
const text = Buffer.from(subArrays.map(str => parseInt(str, 2))).toString()
console.log('明文:', text) 



// 加密文件和文件夹
// desEncode('./test')
// 解密文件和文件夹
// desDecode('./test.des.json')