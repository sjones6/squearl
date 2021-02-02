# Squearl

This is a CLI tool allows you connect to squearl.com's API and schedule tweets without ever leaving the command line.

Learn more at https://squearl.com/docs. 

## Installation

```
npm i -g squearl
```

## Login

You'll need to get an API key from squearl. Once you've created your account, you can visit https://squearl.com/profile/api-keys to get an API key.

```
squearl login
```

This should prompt you for your secret key, and then print out your twitter handle upon success.

## Scheduling Tweets

```
squearl schedule
```

It will prompt you for a tweet body and scheduled time.

You can always view your tweets at https://squearl.com/schedule.

## Other Commands

```
squearl whoami // print out current logged in user
squearl logout // log you out of squearl
```