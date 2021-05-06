# Authentication & Security

### By Dr Angela Yu

Tutorial on Authentication and Security - Level 1 - 6.

## Level 1 - Username and Password Only

- [x] Create Register and Login page
- [x] Save Username and Password with POST request from Register page to Users Database
- [x] Compare Username and Password with saved POST request on Users Database

#### Notes:

- Users can register with invalid email
- Password is not encrypted inside Database

## Level 2 - Data Encryption

### Part 1

- [x] Install "mongoose-encrypt" package
- [x] Set secret variable and implement encrypt method to user's password

#### Notes:

- User's password have been encrypted, but secret variable and database url are still visible

### Part 2

- [x] Install "dotenv" package
- [x] Change secret variable and database url
- [x] Hide secret variable and database url inside .env file

#### Notes:

- If someone gets a hold of the secret variable they can easily decrypt the password

## Level 3 - Hashing

- [x] Install md5 package
- [x] Utilize md5 to Hash user's passwords

#### Notes:

- There are methods to find and decode commonly used passwords and hack users with that method, if a hacker gains access to the database.

## Level 4 - Salting + Hashing

- [x] Install bcrypt package
- [x] Utilize bcrypt to salt and hash user's password.

#### Notes:

- With bcrypt's salt + hash method, it is possible to have different values on the database for the same user password. Password secutiry would depend on user (and it's not good because the average user is not the brightest).

## Level 5 - Cookies and Sessions / Authentication with Passport

- [x] Install passport, passport-local, passport-local-mongoose and express-session packages
- [x] Utilize passport to register, authenticate, login and logout user from website

#### Notes:

- With Passport it is possible to authenticate an user for as long as they have the Coookie created by the POST request in their browser
