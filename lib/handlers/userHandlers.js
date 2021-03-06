
/*
 *
 * SVM
 * userHandlers.js
 * Handler file for users
 *
 */

var _data = require('../data');
var _helpers = require('../helpers');
var _tokenVerify = require('./tokenVerify');

var userHandlers = {};


//Users
userHandlers.users = function(data,callback) {
  var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
      userHandlers._users[data.method](data,callback);
    } else {
      callback(405);
    }
};


userHandlers._users = {};

//Post for userHandlers._user for user data
//Users - post
//Required data: firstName,lastName,phone,password,emailAddress,tosAgreement
//Optional data: none
userHandlers._users.post = function(data,callback) {

  //Validating email address format
  var isEmailValid = {};  
  _helpers.validateEmail(data.payload.emailAddress,function(err, emailVerify) {
    isEmailValid = {
      'value' : err,
      'email' : emailVerify
    };
  });

  if(isEmailValid.value) {

  //Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string'
                          && data.payload.firstName.trim().length > 0
                          ? data.payload.firstName.trim() : false;

  var lastName = typeof(data.payload.lastName) == 'string'
                          && data.payload.lastName.trim().length > 0
                          ? data.payload.lastName.trim() : false;

  var streetNumber = typeof(data.payload.streetNumber) == 'string'
                          && data.payload.streetNumber.trim().length > 0
                          ? data.payload.streetNumber.trim() : false;

  var streetName = typeof(data.payload.streetName) == 'string'
                          && data.payload.streetName.trim().length > 0
                          ? data.payload.streetName.trim() : false;

  var phone = typeof(data.payload.phone) == 'string'
                          && data.payload.phone.trim().length == 10 
                          ? data.payload.phone.trim() : false;

  var password = typeof(data.payload.password) == 'string'
                          && data.payload.password.trim().length > 0
                          ? data.payload.password.trim() : false;

  //Email has already been verified
  var emailAddress =  isEmailValid.email.trim();

  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean'
                          && data.payload.tosAgreement == true
                          ? true : false;

  if(firstName && lastName && streetNumber && streetName && phone && password && emailAddress && tosAgreement) {
    //Make sure that the user doesnt already exist
    _data.read('users',phone,function(err,data){
      if(err) {
       //Hash the password
       var hashedPassword = _helpers.hash(password); 

       //Create user object
       if(hashedPassword) {

       //Create the user object
       var userObject = {
        'firstName' : firstName,
        'lastName' : lastName,
        'streetNumber' : streetNumber,
        'streetName' : streetName,
        'phone' : phone,
        'hashedPassword' : hashedPassword,
        'emailAddress' : emailAddress,
        'tosAgreement' : true
       };

       //Store the user
       _data.create('users',phone,userObject,function(err) {
          if(!err) {
            callback(200,{'Message' : 'Account created.Welcome.Lets get some pizza delicousness'});
          } else {
            console.log(err);
            callback(500,{'Error' : 'Could not create the new user. Directory ./data/users may not exist'}); 
          }
       });
       
       } else {
          callback(500,{'Error' : 'Could not hash the user\'s password'});
       }

      } else {
        //User already exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      };
    });

    } else {
      callback(400,{'Error' : 'Missing required fields'})
    }

  } else {
    callback(400,{'Error' : 'Email format invalid'});
  }
};


//userHandlers._user.get for user
//Users - get
//Required data: phone
//Optional data: none
userHandlers._users.get = function(data,callback) {

  //Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string'
                      && data.queryStringObject.phone.trim().length == 10
                      ? data.queryStringObject.phone.trim() : false;

  if(phone) {
    //Get token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    //Verify that the given token is valid for the phone number
    _tokenVerify.tokenVerify(token,phone,function(tokenIsValid) {
      if(tokenIsValid) {

        //Look up user
        _data.read('users',phone,function(err,data) {
        if(!err && data) {
          //Remove the  hashed password from the user object
          //before returning it to the request handler
          delete data.hashedPassword;
          callback(200,data);
        } else {
          callback(404);
        }
      });

      } else {
        callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
      }

    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  }
};


//Users - put
//Required data: phone
//Optional data: firstName, lastName, streetNumber,streetName, password 
//userHandlers._user.put for user
userHandlers._users.put = function(data,callback) {

  //Check for the requried field
  var phone = typeof(data.payload.phone) == 'string'
                      && data.payload.phone.trim().length == 10
                      ? data.payload.phone.trim() : false;

  //Check for the optional fields
  var firstName = typeof(data.payload.firstName) == 'string'
                          && data.payload.firstName.trim().length > 0
                          ? data.payload.firstName.trim() : false;

  var lastName = typeof(data.payload.lastName) == 'string'
                          && data.payload.lastName.trim().length > 0
                          ? data.payload.lastName.trim() : false;

  var password = typeof(data.payload.password) == 'string'
                          && data.payload.password.trim().length > 0
                          ? data.payload.password.trim() : false;

  var streetNumber = typeof(data.payload.streetNumber) == 'string'
                          && data.payload.streetNumber.trim().length > 0
                          ? data.payload.streetNumber.trim() : false;

  var streetName = typeof(data.payload.streetName) == 'string'
                          && data.payload.streetName.trim().length > 0
                          ? data.payload.streetName.trim() : false;

  //Error if the phone is invalid
  if(phone) {
    //Error if nothing is sent to update
    if(firstName || lastName || streetNumber || streetName || password) {

    //Get token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    //Verify that the given token is valid for the phone number
    _tokenVerify.tokenVerify(token,phone,function(tokenIsValid) {
      if(tokenIsValid) {

        //Look up user
        _data.read('users',phone,function(err,userData) {
          if(!err && userData) {
            //Update the fields necessary
            if(firstName) {
              userData.firstName = firstName;
            }
          
            if(lastName) {
              userData.lastname = lastName;
            }
          
            if(streetNumber) {
              userData.streetNumber = streetNumber;
            }
          
            if(streetName) {
              userData.streetName = streetName;
            }
          
            if(password) {
              userData.hashedPassword = _helpers.hash(password);
            }

            //Store the new updates
            _data.update('users',phone,userData,function(err) {
              if(!err) {
                callback(200,{'Message' : 'Updated user info: '
                                +userData.firstName+' '+userData.lastName+' '
                                +userData.streetNumber+' '+userData.streetName});
              } else {
                console.log(err);
                callback(500,{'Error' : 'Could not update the user'});
              }
            });

        } else {
          callback(400,{'Error' : 'The specified user does not exist'});
        }  
      });

      } else {
        callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
      }
    });


    } else {
      callback(400,{'Error' : 'Missing fields to update'});
    }

  } else {
    callback(400,{'Error' : 'Missing required field'});
  }
  
};


//handlers._users.delete = function(data,callback){
//Users - delete
//Required field : phone
userHandlers._users.delete = function(data,callback) {
  //Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string'
                      && data.queryStringObject.phone.trim().length == 10
                      ? data.queryStringObject.phone.trim() : false;
  if(phone) {
    
    //Get token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    //Verify that the given token is valid for the phone number
    _tokenVerify.tokenVerify(token,phone,function(tokenIsValid) {
      if(tokenIsValid) {
        //Look up user
        _data.read('users',phone,function(err,userData) {
          if(!err && userData) {
            _data.delete('users',phone,function(err) {
              if(!err) {
                //Delete each of the carts associated with the user
                 var userCarts = Object.prototype.toString.call(userCarts) == "[object Array]" 
                                   ? userData.session : userData.session || [];
                  var cartsToDelete = userCarts.length;

                  if(cartsToDelete > 0) {
                    var cartsDeleted = 0;
                    var deletionError = false;
                    //Loop through the carts
                    userCarts.forEach(function(checkId) {
                      //Delete the check
                      _data.delete('cart',checkId,function(err) {
                        if(err) {
                          deletionError = true;
                        }
                        cartsDeleted++;
                        if(cartsDeleted == cartsToDelete) {
                          if(!deletionError) {
                            callback(200,{'Message' : 'Account deleted'});
                          } else {
                            callback(500,{'Error' : 'Errors encounted while attempting to delete all of the user\'s carts. All carts may not have been deleted from the system successfully'});
                          }
                        }
                      });
                    });
                  } else {
                    callback(200, {'Message': 'This operation was a success'});
                  }

              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
            } else {
              callback(400,{'Error' : 'Could not find specified user'});
            }
        });
      } else {
        callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field in user delete'});
  }
};


module.exports = userHandlers;
