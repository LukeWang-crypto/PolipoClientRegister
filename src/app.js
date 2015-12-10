var http = require('http');
var url = require("url");
var qs = require('querystring');
var fs = require('fs');

//handle request based on route
var router={
    home:function(req,res)
    {

        

        //write the HTTP header
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><head></head><body>');
       
        res.write('<h1>Register Your device</h1>');
        res.write('<h3>Your IP Address: '+res.connection.remoteAddress+'</h3>');

        res.write('<form method="post" action="/register">\
                      <input type="text" name="userName">\
                      <input type="password" name="password">\
                      <input type="submit" value="Submit">\
                  </form>');

        res.write('</body></html>');
        //close the response
        res.end();
    },
    register:function(req,res)
    {
        if(req.method=='POST') {
            var body='';
            req.on('data', function (data) {
                body +=data;
            });
            req.on('end',function(){
                var postData =  qs.parse(body);                
                console.log(postData);

                res.writeHead(200, {'Content-Type': 'text/html'});

                if(postData&&postData.userName&&postData.password)
                {
                    if(postData.userName=='luke'&&postData.password=='pwd')
                    {
                        registerNewClient(res,res.connection.remoteAddress);
                        
                    }
                    else
                    {
                        res.write('Error: incorrect user name or password');
                        res.end('<br/><a href="/">retry</a>');             
                    }
                }
                else
                {                    
                    res.write('Error: user information is null');
                    res.end('<br/><a href="/">retry</a>');
                }
            });
        }
        else {
            res.end('not support get method');
        }
        
    },
    route:function(pathname,req,res)
    {
      if(pathname=='/')
        pathname='home';
      else if(pathname)
        pathname=pathname.replace('/','');

      if(this[pathname])
      {
          this[pathname](req,res);
      }
      else
       {
          console.log("404 Not Found " + pathname);
          
          //for now just send a 404 and a short message
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.end("<html><head></head><body>Page Not Found</body></html>");
       }
    }
};

function requestHandler(req, res) {
  var pathname = url.parse(req.url).pathname;
  console.log("Request for " + pathname + " received.");
  router.route(pathname,req,res); 
}



function registerNewClient(res,ip) {
  var configFile='/etc/polipo/config';
  fs.readFile(configFile, 'utf-8', function(err, data){
    if (err) {
      console.log('read config file error:'+err);
      res.end('read config file error:'+err);
      return ;
    }
    //console.log(data);
    //var matchValue = data.match(/allowedClients=/i);
    //console.log('match:'+matchValue);
    var newValue = data.replace(/allowedClients=/i, 'allowedClients='+ip+',');
    //console.log(newValue);
    fs.writeFile(configFile, newValue, 'utf-8', function (err) {
      if (err) {
        console.log('update config file error:'+err);
        res.end('update config file error:'+err);
        return ;
      };
      

      if(data.indexOf(ip) > -1)
      {
        res.end('success');
        console.log('IP has been registered');
        return;        
      }

      var child_process = require('child_process');

      child_process.exec('systemctl restart polipo', function(err, stdout, stderr) {
          if(err)
          {
              console.log('Error:'+err);
              res.end('error:'+err);
          }  
          else
            {
              console.log('restarted polipo service:'+stdout);
              res.end('Your IP register successfully');
            }
      });

    });
  });
}


http.createServer(requestHandler).listen(8080);