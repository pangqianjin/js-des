const {encodeFile, decodeFile} = require('./utils')

// 加密文本文件
const leftTrimLength1 = encodeFile('./utils.js', './utils.js.bk', 'utf-8')
decodeFile(leftTrimLength1, './utils.js.bk', './utils.js.bk.bk', 'utf-8')

// 加密图像文件
const leftTrimLength2 = encodeFile('./default_avatar.png', './default_avatar.bk.png', 'base64')
decodeFile(leftTrimLength2, './default_avatar.bk.png', './default_avatar.bk.bk.png', 'base64')

