module Main where

import Text.Regex.PCRE

data User = User {
    mail :: String,
    id :: String
} deriving (Show)

parse :: String -> String -> Either String String
parse regex value = if value =~ regex
    then Right value
    else Left $ "Could not parse " ++ value ++ " with regex " ++ regex

toUser mail userId = User <$> (parse ".*@.*" mail) <*> (parse "[a-z]" userId)

main :: IO ()
main = do
    putStrLn $ show $ toUser "test@test.com" "user"
