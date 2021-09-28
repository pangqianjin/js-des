# js-des

#### 介绍
commonJS实现DES加密算法，可以加密64位的二进制01字符串、文本文件、jpg|png|jpeg图像文件、文件夹等（递归加密）

#### 使用说明
utils.js中向外暴露了三个方法:
```js
DES(M:string, key?:string)
desEncode(pathname:string, key?:string)
desDecode(pathname:string, key?:string)
```

示例：

```javascript
// 加密
// 结果为: 1000010111101000000100110101010000001111000010101011010000000101
DES('0001001100110100010101110111100110011011101111001101111111110001',
     '0000000100100011010001010110011110001001101010111100110111101111', ENCODE)

// 解密
DES('0001001100110100010101110111100110011011101111001101111111110001', 
     '1000010111101000000100110101010000001111000010101011010000000101', DECODE)

desEncode('./test')
desDecode('./test.des.json')
```

