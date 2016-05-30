Feature: BLE device monitoring
  The application should track nearby devices.
  Whenever there is a device nearby it should send a message to the platform

  Scenario: BLE device found
    When a BLE device is in range
    Then the application should report the finding to the platform
