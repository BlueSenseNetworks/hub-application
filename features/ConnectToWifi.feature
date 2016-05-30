Feature: Connect to wifi
  The application should be able to connect the device to a wifi.
  The normal workflow is to first scan the nearby wifis and then connect to one of them.

  Background:
    Given the following wifi networks are available:
      | ssid | passphrase |
      | ASUS | bastor519  |

  Scenario: User sends a message to join a wifi network
    Given the wifi scan was started
    When I join the 'ASUS' wifi network
    Then a message should be received that the wifi has been joined
