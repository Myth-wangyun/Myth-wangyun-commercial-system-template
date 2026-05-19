from flask import Flask
from market.api.baidu_callback import baidu_api

app = Flask(__name__)
app.register_blueprint(baidu_api)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
