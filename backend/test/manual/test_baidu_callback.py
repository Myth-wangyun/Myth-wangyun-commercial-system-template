"""
测试百度营销API OAuth回调验签逻辑

使用实际收到的参数测试验签是否能通过
"""
import sys
sys.path.insert(0, '.')

from app.services.market.baidu_marketing.crypto_utils import SignatureService, AESCrypto
import json
import base64

# 从你的请求中提取的实际参数
params = {
    "appId": "4db76a4cd04459568e1144b6d6d89f92",
    "authCode": "eyJhbGciOiJIUzM4NCJ9.eyJhdWQiOiLmuIXnvo7mlZnogrLmlbDmja5hcGkiLCJzdWIiOiJleGMiLCJ1aWQiOjIyOTM5MDA3LCJhcHBJZCI6IjRkYjc2YTRjZDA0NDU5NTY4ZTExNDRiNmQ2ZDg5ZjkyIiwiaXNzIjoi5ZWG5Lia5byA5Y-R6ICF5Lit5b-DIiwicGxhdGZvcm1JZCI6IjQ5NjAzNDU5NjU5NTg1NjE3OTQiLCJleHAiOjE3Njg5ODI4OTAsImp0aSI6Ii04MTEzMDY3MjkzNjkwNDYyMjAyIn0.x11P9C5dzs3vbHmjOpXQADm8lowslb9xq_zcWdPIlzZObyxu-UfBU-HT4u-ip12X",
    "state": "e3582390dbc6b6f9da8045a47bd53556",
    "timestamp": "1768981090195",
    "userId": "22939007"
}

received_signature = "1CDB2AD14BE56A4CAD6046A798C24170E24636B6DCFF26328708D538AD89263C06462822719FBCCA0306174A00A05B5DDE9BDC12C1EF7CA20505AF9C7A9AD87BF0AFDC84A4D279695F98445C3E4203345AB75B82D1DE2AA304DA8B20C3996B79B28CFF6959E12273C774431B416AF14CE20CB0E5474E280991AF0CA7649FBC1F90DB55ABE0AB51CEE60D5F4DBBC764F9FCA24CDBD7FE3C16B007C68D85DFE68712FB1835E2B1A6338D7797B3A36072930A2203B1E78487B5095BBA913FC6C82189CB82E52B6B964D8000C680C038FC482228195459DCB9BEFB18FE43FA81B1ECEF3B44308229C57E0084BD7A3D8352AFCD4678237B80C844307B7924FFFE8D7934C3854399B58428746FE04AB35482EAF79F4E6503C77FEBDF217B07807D12683C4E8B16B14D059999C6BFE6BFEBDB192A0C99184F6BB0D1E3C954D399E86B94A7595F8F1A3975F3E97EDB752A3D5E519E6556FC1FAC81CF480A3EC20927C705B52F30DAFEC92049F76909F4807666BE5A4F3D74E627970976309B88A0CDFA436530087C77F3BD7645ACB3611C0835BFE1C1A29FF31CA43BB1FDDE6C8AE69E9F09D2E15624693A9C6036E64CB33222519648006821E64FE22FD75D15E82B4FAA873931E0740C5C0ED7466819CCB839F473B8D93B8AE77E2B4132C49B102F30B6D2CF91D53A2A7144D0857F4E63AF4108B4E93032552470936AB418F1F2894DD97C36F796E56C0E6892C5FA811B49290DD58BC710D42D3BC7200301D14457362EFE5CFC07D081E2E85A07C548B8BE92C8A8FC6AA8FE1B41D85528362C92060459C7D436D50FC97311453E47639A805A2B5B848AC202B803F2583FC6DF005420768843E78B529A0864FC6DE354424EA3AD08539E51CBACBF85075DFE8927659DC25741715BA81228BF739AB69CE7F51BB6D13BEDE2458EE622CE939586AF1D620EC2355EE446B8D0A179D9538BAADDF8FB19291B8B29D25034704E13CDE253475E"

# 使用实际的配置（来自.env.production）
app_id = "4db76a4cd04459568e1144b6d6d89f92"
secret_key = "0cba74c738030e5f086b3927d68fa7ea"
developer_user_id = 22939007

print(f"使用配置:")
print(f"  app_id: {app_id}")
print(f"  secret_key: {secret_key[:8]}...")
print(f"  developer_user_id: {developer_user_id}")
print()

# 1. 验证 state
print("=" * 60)
print("1. 验证 state")
expected_state = SignatureService.generate_state(app_id, developer_user_id)
print(f"  期望 state: {expected_state}")
print(f"  收到 state: {params['state']}")
print(f"  state 验证: {'✅ 通过' if expected_state == params['state'] else '❌ 失败'}")
print()

# 2. 验证签名
print("=" * 60)
print("2. 验证签名")

# 按照百度文档：按key自然排序
sorted_params = dict(sorted(params.items()))
print(f"  排序后的参数: {list(sorted_params.keys())}")

# 转JSON
json_str = json.dumps(sorted_params, ensure_ascii=False, separators=(',', ':'))
print(f"  JSON字符串长度: {len(json_str)}")
print(f"  JSON字符串前100字符: {json_str[:100]}...")

# Base64编码
base64_str = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
print(f"  Base64长度: {len(base64_str)}")

# AES加密
generated_signature = AESCrypto.encrypt_cbc(
    base64_str.encode('utf-8'),
    secret_key[:16]
)
print(f"  生成的签名长度: {len(generated_signature)}")
print(f"  生成的签名前60字符: {generated_signature[:60]}...")
print(f"  收到的签名前60字符: {received_signature[:60]}...")
print(f"  签名验证: {'✅ 通过' if generated_signature == received_signature else '❌ 失败'}")

if generated_signature != received_signature:
    print()
    print("签名不匹配，尝试解密收到的签名查看内容:")
    try:
        decrypted = AESCrypto.decrypt_cbc(received_signature, secret_key[:16])
        decoded = base64.b64decode(decrypted).decode('utf-8')
        print(f"  解密后的JSON: {decoded[:200]}...")
    except Exception as e:
        print(f"  解密失败: {e}")

print()
print("=" * 60)
print("测试完成")
