from flask import Blueprint, request, jsonify

baidu_api = Blueprint('baidu_api', __name__)

# TODO: Replace with your actual state value (should be securely generated and stored)
SAVED_STATE = "your_random_state_string"

@baidu_api.route('/baidu/callback', methods=['GET'])
def baidu_callback():
    try:
        # 1. 获取回调参数
        code = request.args.get('code')
        state = request.args.get('state')

        # 2. 校验state，防止CSRF攻击
        if state != SAVED_STATE:
            return jsonify({"error": "Invalid state parameter"}), 403

        # 3. 记录日志
        print(f"收到授权码：{code}")
        print(f"收到state：{state}")

        # 4. （可选）用code换取Access Token
        # 这里可以调用百度的token接口，获取access_token和refresh_token
        # 并将它们存储到数据库或配置文件中

        # 5. 返回成功响应
        return jsonify({
            "status": "success",
            "message": "授权码已接收",
            "code": code
        }), 200

    except Exception as e:
        print(f"回调接口出错：{str(e)}")
        return jsonify({"error": str(e)}), 500
