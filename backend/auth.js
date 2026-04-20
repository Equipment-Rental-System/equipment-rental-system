const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => { //로그인 인증 미들웨어
    const authHeader = req.headers['authorization']; //헤더에서 'Authorization: Bearer 토큰값' 형식으로 응답
    const token = authHeader && authHeader.split(' ')[1]; //Bearer와 토큰 분리

    if(!token){
        return res.status(401).json({ //토큰이 없을 시
            message : `로그인이 필요한 서비스 입니다.`
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => { //토큰 검증
        if(err){ //토큰이 유효하지 않은 경우
            return res.status(403).json({
                message : `유효하지 않거나 만료된 토큰입니다.`
            });
        }
 
        req.user = user; //로그인 시 payload 
        next(); //다음단계로 넘김
    })
    
}

const isAdmin = (req, res, next) => { //관리자 인증 미들웨어
    if(req.user && req.user.role == 'ADMIN') { //사용자의 권한이 관리자인 경우 통과
        next();
    } else{
        return res.status(403).json({
            message : `관리자만 접근 가능한 페이지 입니다.`
        });
    }
}

module.exports = { authenticateToken, isAdmin }; //모듈 내보내기