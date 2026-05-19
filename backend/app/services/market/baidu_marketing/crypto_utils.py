"""
百度营销API - 加密和签名工具

实现AES-CBC-128加密和签名验证功能
"""

import base64
import hashlib
import json
from typing import Any, Dict, Union

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


class AESCrypto:
    """
    AES加密工具类
    
    百度营销API使用AES-CBC-128加密，IV为16个空字节
    """
    
    # 固定的IV（16个空字节）
    IV = b'\0' * 16
    
    @staticmethod
    def _pad(data: bytes, block_size: int = 16) -> bytes:
        """
        填充数据到block_size的整数倍（NoPadding方式，用0填充）
        
        Args:
            data: 原始数据
            block_size: 块大小，默认16
            
        Returns:
            填充后的数据
        """
        if len(data) % block_size == 0:
            return data
        padding_len = block_size - (len(data) % block_size)
        return data + b'\0' * padding_len
    
    @staticmethod
    def _unpad(data: bytes) -> bytes:
        """
        移除填充的空字节
        
        Args:
            data: 填充后的数据
            
        Returns:
            原始数据
        """
        return data.rstrip(b'\0')
    
    @classmethod
    def encrypt_cbc(cls, plaintext: bytes, key: str) -> str:
        """
        AES-CBC加密（返回十六进制字符串）
        
        Args:
            plaintext: 明文数据
            key: 密钥（取前16位）
            
        Returns:
            加密后的十六进制字符串
        """
        # 确保密钥是16字节
        key_bytes = key[:16].encode('utf-8')
        if len(key_bytes) < 16:
            key_bytes = key_bytes + b'\0' * (16 - len(key_bytes))
        
        # 填充数据
        padded_data = cls._pad(plaintext)
        
        # 创建加密器
        cipher = Cipher(
            algorithms.AES(key_bytes),
            modes.CBC(cls.IV),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # 加密
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        
        # 转为十六进制字符串（大写）
        return encrypted.hex().upper()
    
    @classmethod
    def decrypt_cbc(cls, ciphertext_hex: str, key: str) -> str:
        """
        AES-CBC解密（输入为十六进制字符串）
        
        Args:
            ciphertext_hex: 加密后的十六进制字符串
            key: 密钥（取前16位）
            
        Returns:
            解密后的字符串
        """
        # 确保密钥是16字节
        key_bytes = key[:16].encode('utf-8')
        if len(key_bytes) < 16:
            key_bytes = key_bytes + b'\0' * (16 - len(key_bytes))
        
        # 十六进制转字节
        encrypted = bytes.fromhex(ciphertext_hex)
        
        # 创建解密器
        cipher = Cipher(
            algorithms.AES(key_bytes),
            modes.CBC(cls.IV),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # 解密
        decrypted = decryptor.update(encrypted) + decryptor.finalize()
        
        # 移除填充并转为字符串
        return cls._unpad(decrypted).decode('utf-8')
    
    @classmethod
    def encrypt_ecb(cls, plaintext: bytes, key: str) -> str:
        """
        AES-ECB加密（返回Base64字符串）
        
        Args:
            plaintext: 明文数据
            key: 密钥（取前16位）
            
        Returns:
            加密后的Base64字符串
        """
        # 确保密钥是16字节
        key_bytes = key[:16].encode('utf-8')
        if len(key_bytes) < 16:
            key_bytes = key_bytes + b'\0' * (16 - len(key_bytes))
        
        # 填充数据
        padded_data = cls._pad(plaintext)
        
        # 创建加密器
        cipher = Cipher(
            algorithms.AES(key_bytes),
            modes.ECB(),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # 加密
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        
        # 转为Base64
        return base64.b64encode(encrypted).decode('utf-8')
    
    @classmethod
    def decrypt_ecb(cls, ciphertext_b64: str, key: str) -> str:
        """
        AES-ECB解密（输入为Base64字符串）
        
        Args:
            ciphertext_b64: 加密后的Base64字符串
            key: 密钥（取前16位）
            
        Returns:
            解密后的字符串
        """
        # 确保密钥是16字节
        key_bytes = key[:16].encode('utf-8')
        if len(key_bytes) < 16:
            key_bytes = key_bytes + b'\0' * (16 - len(key_bytes))
        
        # Base64解码
        encrypted = base64.b64decode(ciphertext_b64)
        
        # 创建解密器
        cipher = Cipher(
            algorithms.AES(key_bytes),
            modes.ECB(),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # 解密
        decrypted = decryptor.update(encrypted) + decryptor.finalize()
        
        # 移除填充并转为字符串
        return cls._unpad(decrypted).decode('utf-8')


class SignatureService:
    """
    签名服务类
    
    用于生成和验证百度营销API回调的签名
    """
    
    @staticmethod
    def generate_state(app_id: str, developer_user_id: Union[int, str]) -> str:
        """
        生成state参数（用于防CSRF）
        
        算法：MD5(appId + "_" + developerUserId)
        
        Args:
            app_id: 应用ID
            developer_user_id: 开发者用户ID
            
        Returns:
            32位MD5哈希值
        """
        raw_string = f"{app_id}_{developer_user_id}"
        return hashlib.md5(raw_string.encode('utf-8')).hexdigest()
    
    @staticmethod
    def verify_state(app_id: str, developer_user_id: Union[int, str], state: str) -> bool:
        """
        验证state参数
        
        Args:
            app_id: 应用ID
            developer_user_id: 开发者用户ID
            state: 收到的state参数
            
        Returns:
            验证是否通过
        """
        expected_state = SignatureService.generate_state(app_id, developer_user_id)
        return expected_state == state
    
    @staticmethod
    def generate_signature(params: Dict[str, Any], secret_key: str) -> str:
        """
        生成回调签名
        
        算法：
        1. 将参数按key自然排序
        2. 转为JSON字符串
        3. Base64编码
        4. 使用secretKey前16位做AES-CBC加密
        
        Args:
            params: 参数字典（不含signature）
            secret_key: 应用密钥
            
        Returns:
            签名字符串
        """
        # 1. 按key自然排序（使用TreeMap等效的排序）
        sorted_params = dict(sorted(params.items()))
        
        # 2. 转为JSON字符串（确保key的顺序）
        json_str = json.dumps(sorted_params, ensure_ascii=False, separators=(',', ':'))
        
        # 3. Base64编码
        base64_str = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
        
        # 4. AES-CBC加密（使用secretKey前16位）
        signature = AESCrypto.encrypt_cbc(
            base64_str.encode('utf-8'),
            secret_key[:16]
        )
        
        return signature
    
    @staticmethod
    def verify_signature(
        params: Dict[str, Any],
        signature: str,
        secret_key: str
    ) -> bool:
        """
        验证回调签名
        
        Args:
            params: 参数字典（不含signature）
            signature: 收到的签名
            secret_key: 应用密钥
            
        Returns:
            验证是否通过
        """
        expected_signature = SignatureService.generate_signature(params, secret_key)
        return expected_signature == signature


def md5_hash(data: str) -> str:
    """
    计算MD5哈希值
    
    Args:
        data: 原始字符串
        
    Returns:
        32位小写MD5哈希值
    """
    return hashlib.md5(data.encode('utf-8')).hexdigest()
