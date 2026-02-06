import Testing
@testable import Shelix

struct ShelixTests {

    @Test("Host app points to the Shelix extension bundle")
    func extensionBundleIdentifierIsConfigured() {
        #expect(extensionBundleIdentifier == "im.justsitandgrin.Shelix.Extension")
        #expect(!extensionBundleIdentifier.contains("example"))
    }
}
