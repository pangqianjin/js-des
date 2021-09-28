const { desEncode, DES, desDecode } = require('./utils')

// 加密
// 结果为: 1000010111101000000100110101010000001111000010101011010000000101
// DES('0001001100110100010101110111100110011011101111001101111111110001',
//     '0000000100100011010001010110011110001001101010111100110111101111', ENCODE)

// 解密
// DES('0001001100110100010101110111100110011011101111001101111111110001', 
//     '1000010111101000000100110101010000001111000010101011010000000101', DECODE)

desEncode('./test')
// desDecode('./test.des.json')