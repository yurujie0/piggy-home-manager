
        "version": "1.1.0",
        "versionCode": 2,
        "downloadUrl": "http://8.135.17.245:18000/download/latest.apk",
        "releaseNotes": "新增SQLite数据库支持",
        "forceUpdate": False
    }

# ==================== 启动服务 ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18001)
