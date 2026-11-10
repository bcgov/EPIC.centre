from centre_api import create_app


application = create_app()

if __name__ == "__main__":
    application.run(debug=application.debug, host='0.0.0.0', port=3400)